import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, sendEmailOtp, verifyEmailOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'Mechanical', 'Electrical', 'Civil', 'IT'];

const Signup = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    branch: '', phone: ''
  });
  const [collegeIdFile, setCollegeIdFile] = useState(null);
  const [collegeIdPreview, setCollegeIdPreview] = useState(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Step management: 1=Details, 2=Email OTP, 3=Phone OTP
  const [step, setStep] = useState(1);

  // Email OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [emailToken, setEmailToken] = useState(null); // Returned after email verification
  const [emailOtpSending, setEmailOtpSending] = useState(false);

  // Phone OTP (Firebase)
  const [phoneOtp, setPhoneOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const collegeIdInputRef = useRef(null);
  const recaptchaContainerRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─── College ID Image ───────────────────────────────────────────────────────
  const handleCollegeIdImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('College ID image must be less than 10MB');
      return;
    }
    setCollegeIdFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCollegeIdPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ─── Camera / Selfie ────────────────────────────────────────────────────────
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      toast.error('Camera access denied. Please allow camera permission and try again.');
    }
  }, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraOpen]);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const captureSelfie = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (!dataUrl || dataUrl === 'data:,') {
      toast.error('Failed to capture camera frame. Please try again.');
      return;
    }
    setSelfieDataUrl(dataUrl);
    toast.success('Selfie captured!');
    closeCamera();
  }, [closeCamera]);

  const dataURLtoFile = (dataUrl, filename) => {
    try {
      const [header, data] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)[1];
      const binary = atob(data);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      return new File([arr.buffer], filename, { type: mime });
    } catch {
      return null;
    }
  };

  // ─── Step 1 → Step 2: Send Email OTP ───────────────────────────────────────
  const handleStep1Next = async () => {
    if (!form.name || !form.email || !form.password || !form.branch || !form.phone) {
      return toast.error('Please fill all required fields');
    }
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!form.phone.match(/^\+?[1-9]\d{9,14}$/)) return toast.error('Enter a valid phone number (e.g. +919876543210)');
    if (!collegeIdFile) return toast.error('Please upload your College ID image');
    if (!selfieDataUrl) return toast.error('Please capture your selfie photo');

    setEmailOtpSending(true);
    try {
      await sendEmailOtp(form.email, form.name);
      toast.success(`OTP sent to ${form.email}!`);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setEmailOtpSending(false);
    }
  };

  // ─── Step 2: Verify Email OTP ───────────────────────────────────────────────
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await verifyEmailOtp(form.email, emailOtp);
      setEmailToken(data.emailToken);
      toast.success('Email verified! ✅ Now verify your phone number.');
      setStep(3);
      // Initialize Firebase reCAPTCHA after moving to step 3
      setTimeout(() => initRecaptcha(), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Send Phone OTP via Firebase ────────────────────────────────────
  const initRecaptcha = () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => setRecaptchaReady(true),
          'expired-callback': () => {
            setRecaptchaReady(false);
            toast.error('reCAPTCHA expired. Please solve it again.');
          },
        });
        window.recaptchaVerifier.render();
      }
    } catch (err) {
      console.error('reCAPTCHA init error:', err);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!form.phone) return toast.error('Phone number missing');
    let phoneNumber = form.phone.trim();
    if (!phoneNumber.startsWith('+')) phoneNumber = '+91' + phoneNumber;

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(result);
      toast.success(`OTP sent to ${phoneNumber}!`);
    } catch (err) {
      console.error('Phone OTP error:', err);
      toast.error(err.message || 'Failed to send phone OTP. Check your Firebase setup.');
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
        setRecaptchaReady(false);
        setTimeout(() => initRecaptcha(), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!confirmationResult) return toast.error('Please send phone OTP first');
    if (!phoneOtp || phoneOtp.length !== 6) return toast.error('Enter the 6-digit phone OTP');
    setLoading(true);
    try {
      await confirmationResult.confirm(phoneOtp);
      toast.success('Phone verified! ✅ Creating your account...');
      await handleFinalRegister();
    } catch (err) {
      toast.error(err.message || 'Incorrect phone OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Final Account Creation ─────────────────────────────────────────────────
  const handleFinalRegister = async () => {
    setLoading(true);
    try {
      const rest = { ...form };
      delete rest.confirmPassword;
      const formData = new FormData();
      Object.entries(rest).forEach(([k, v]) => formData.append(k, v));
      formData.append('role', 'student');
      formData.append('emailToken', emailToken); // Proof of email verification
      formData.append('collegeIdImage', collegeIdFile, collegeIdFile.name);
      const selfieFile = dataURLtoFile(selfieDataUrl, `selfie-${Date.now()}.jpg`);
      if (!selfieFile) {
        toast.error('Failed to process selfie. Please retake.');
        setLoading(false);
        return;
      }
      formData.append('selfieImage', selfieFile, selfieFile.name);

      const res = await registerUser(formData);
      login(res.data, res.data.token);
      toast.success('🎉 Account created! Welcome to RentMate!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────
  const stepLabels = ['Details & Photos', 'Email OTP', 'Phone OTP'];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Join RentMate as a Student</h1>
          <p className="text-slate-500 text-sm mt-1">Dual verification required for a safe campus community</p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-2 mb-6">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <div className={`h-2 rounded-full transition-all mb-1.5 ${step >= i + 1 ? 'bg-primary-500' : 'bg-slate-200'}`} />
              <span className={`text-xs font-medium ${step >= i + 1 ? 'text-primary-700' : 'text-slate-400'}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="card p-6 md:p-8">

          {/* ── STEP 1: Account Details + Photos ───────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">📋 Step 1 — Account Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="input-field" />
                  <p className="text-xs text-slate-400 mt-1">Include country code, e.g. +91</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch *</label>
                <select name="branch" value={form.branch} onChange={handleChange} className="input-field" required>
                  <option value="">Select Your Branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className="input-field pr-10" required />
                    <button type="button" onClick={() => setShowPass(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirmPass ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="input-field pr-10" required />
                    <button type="button" onClick={() => setShowConfirmPass(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirmPass ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                    </button>
                  </div>
                </div>
              </div>

              {/* College ID Upload */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="block text-sm font-semibold text-amber-800 mb-2">📷 College ID Card Photo *</label>
                {collegeIdPreview ? (
                  <div className="relative">
                    <img src={collegeIdPreview} alt="College ID" className="w-full h-40 object-cover rounded-lg border border-amber-300" />
                    <button type="button" onClick={() => { setCollegeIdFile(null); setCollegeIdPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600 transition">
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div onClick={() => collegeIdInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-amber-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-100 transition">
                    <span className="text-3xl mb-1">🪪</span>
                    <p className="text-sm font-medium text-amber-700">Click to upload College ID image</p>
                    <p className="text-xs text-amber-500 mt-0.5">JPEG, PNG up to 10MB</p>
                  </div>
                )}
                <input ref={collegeIdInputRef} type="file" accept="image/*" onChange={handleCollegeIdImage} className="hidden" />
              </div>

              {/* Selfie */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <label className="block text-sm font-semibold text-emerald-800 mb-2">🤳 Live Selfie Photo *</label>
                {selfieDataUrl ? (
                  <div className="relative">
                    <img src={selfieDataUrl} alt="Selfie" className="w-full h-auto object-cover rounded-lg border-2 border-emerald-400" />
                    <button type="button" onClick={() => setSelfieDataUrl(null)} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600 transition">✕ Retake</button>
                  </div>
                ) : cameraOpen ? (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-xl overflow-hidden border-2 border-emerald-300">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[60vh] object-cover scale-x-[-1]" />
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={captureSelfie} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md">📸 Capture Photo</button>
                      <button type="button" onClick={closeCamera} className="px-4 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={openCamera} className="w-full h-32 border-2 border-dashed border-emerald-300 rounded-xl flex flex-col items-center justify-center hover:border-emerald-500 hover:bg-emerald-100 transition">
                    <span className="text-3xl mb-1">📷</span>
                    <p className="text-sm font-medium text-emerald-700">Click to open camera & take selfie</p>
                  </button>
                )}
              </div>

              <button type="button" onClick={handleStep1Next} disabled={emailOtpSending} className="btn-primary w-full py-3 text-base mt-2">
                {emailOtpSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP...
                  </span>
                ) : 'Next → Verify Email'}
              </button>
            </div>
          )}

          {/* ── STEP 2: Email OTP ──────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-3">📧</div>
                <h2 className="text-xl font-bold text-slate-800">Check Your Email</h2>
                <p className="text-slate-500 text-sm mt-1">
                  We sent a 6-digit OTP to <strong className="text-primary-600">{form.email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Enter Email OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtp}
                  onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="input-field text-center text-3xl font-bold tracking-[0.5em] py-4"
                  autoFocus
                />
                <p className="text-xs text-slate-400 text-center mt-2">OTP is valid for 5 minutes</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 text-center">
                💡 <strong>Hint:</strong> Check your email inbox. If email isn't arriving, you can use the test OTP <strong>123456</strong> to proceed.
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</span> : '✅ Verify Email OTP'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-700">← Back</button>
                <button type="button" onClick={() => { setEmailOtpSending(true); sendEmailOtp(form.email, form.name).then(() => toast.success('New OTP sent!')).catch(e => toast.error(e.response?.data?.message || 'Failed')).finally(() => setEmailOtpSending(false)); }} className="text-primary-600 hover:underline">
                  {emailOtpSending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Phone OTP via Firebase ─────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-5xl mb-3">📱</div>
                <h2 className="text-xl font-bold text-slate-800">Verify Your Phone</h2>
                <p className="text-slate-500 text-sm mt-1">
                  We'll send an OTP to <strong className="text-primary-600">{form.phone}</strong>
                </p>
              </div>

              {!confirmationResult ? (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-600 font-medium mb-3">Complete the security check below, then click Send OTP:</p>
                    <div id="recaptcha-container" ref={recaptchaContainerRef} className="flex justify-center" />
                  </div>
                  <button onClick={handleSendPhoneOtp} disabled={loading || !recaptchaReady} className="btn-primary w-full py-3 text-base">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</span>
                    ) : '📲 Send Phone OTP'}
                  </button>
                </>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Enter Phone OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="input-field text-center text-3xl font-bold tracking-[0.5em] py-4"
                      autoFocus
                    />
                    <p className="text-xs text-slate-400 text-center mt-2">OTP is valid for 10 minutes</p>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying & Creating Account...</span>
                    ) : '✅ Verify Phone & Create Account'}
                  </button>
                </form>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                ⚠️ Phone OTP uses Firebase. If it's not working, you can skip this step.
              </div>
              <button
                type="button"
                onClick={handleFinalRegister}
                disabled={loading}
                className="w-full py-2 text-sm text-slate-500 hover:text-primary-600 underline transition"
              >
                Skip Phone Verification → Create Account
              </button>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
            </p>
            <p className="text-sm text-slate-400">
              Management Team?{' '}
              <Link to="/management-login" className="text-emerald-600 font-semibold hover:underline">Management Team Login →</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
