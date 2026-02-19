import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { profileService } from '../lib/profile';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setHasError(true);
      alert("As senhas não coincidem.");
      return;
    }

    if (!name) {
      setHasError(true);
      alert("Por favor, preencha o seu nome.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setHasError(true);
      console.error('Signup error:', error.message);
      alert("Erro ao cadastrar: " + error.message);
    } else {
      if (data.user) {
        // Patient record is automatically created by DB Trigger
        console.log("User created, trigger should handle patient record.");
      }
      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setIsRegistering(false);
    // Reset form fields
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasError(false);

    try {
      if (!email || !password) {
        setHasError(true);
        setLoading(false);
        return;
      }

      if (isRegistering) {
        await handleSignUp();
        setLoading(false);
        return;
      }

      // 5 second timeout for login attempt
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Tempo limite de conexão excedido.')), 8000)
      );

      const { error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) {
        setHasError(true);
        console.error('Login error:', error.message);
        alert("Erro no Login: " + (error.message === 'Tempo limite de conexão excedido.' ? 'O servidor demorou muito para responder.' : 'Email ou senha incorretos'));
      } else {
        onLogin();
      }
    } catch (err: any) {
      setHasError(true);
      console.error('Unexpected error:', err);
      // Ensure we alert the user if it was a timeout
      if (err.message === 'Tempo limite de conexão excedido.') {
        alert('Tempo limite de conexão excedido. Verifique sua internet.');
      }
    } finally {
      if (!isRegistering) setLoading(false);
    }
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin
      });

      if (error) throw error;

      alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotModal(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      alert('Erro ao enviar email: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Seu segredo está guardado! Fique Tranquila!");
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Termos de serviço...");
  };

  const inputErrorClass = hasError
    ? "border-red-500 focus:border-red-600 focus:ring-red-200"
    : "border-[#e3e0de] focus:ring-primary/50 focus:border-primary";

  return (
    <div className="flex h-screen w-full bg-white font-sans">
      {/* Left Side - Image */}
      <div className="hidden md:block w-1/2 relative overflow-hidden bg-primary/10">
        <div className="absolute inset-0 bg-black/30 z-10 transition-opacity duration-700"></div>
        <img
          src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Clinic Aesthetics"
          className="w-full h-full object-cover animate-fade-in scale-105 hover:scale-100 transition-transform duration-[20s]"
        />
        <div className="absolute bottom-0 left-0 p-12 z-20 text-white max-w-lg">
          <h2 className="font-serif text-5xl font-bold mb-6 leading-tight animate-fade-in">Realce sua<br />beleza natural.</h2>
          <p className="text-white/90 text-lg font-light animate-fade-in delay-100 border-l-2 border-primary pl-4">
            Cuidado exclusivo, tecnologia avançada e um atendimento pensado com carinho para realçar a sua melhor versão.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-[#FDFBF9]">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center md:text-left">
            <div className="flex justify-center md:justify-start mb-6">
              <div className="bg-primary/10 p-4 rounded-2xl inline-flex shadow-sm border border-primary/20">
                <span className="material-symbols-outlined text-primary text-4xl">spa</span>
              </div>
            </div>
            <h1 className="font-serif text-4xl font-bold text-text-main mb-3">
              {isRegistering ? 'Crie sua conta' : 'Bem-vinda'}
            </h1>
            <p className="text-text-muted text-lg">
              {isRegistering ? 'Preencha os dados abaixo para começar.' : 'Insira suas credenciais para acessar o painel.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {hasError && !isRegistering && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 animate-fade-in flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                Email ou senha incorretos.
              </div>
            )}

            {isRegistering && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Nome Completo</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-[#e3e0de] outline-none transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="Seu Nome"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${hasError ? 'text-red-500' : 'text-text-muted'}`}>Email</label>
              <div className="relative">
                <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 ${hasError ? 'text-red-400' : 'text-gray-400'}`}>mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setHasError(false);
                  }}
                  className={`w-full h-12 pl-12 pr-4 rounded-xl bg-white border outline-none transition-all placeholder:text-gray-300 focus:ring-2 ${inputErrorClass}`}
                  placeholder="seu@email.com"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-xs font-bold uppercase tracking-widest ${hasError ? 'text-red-500' : 'text-text-muted'}`}>Senha</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-primary font-bold hover:text-primary-dark transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 ${hasError ? 'text-red-400' : 'text-gray-400'}`}>lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setHasError(false);
                  }}
                  className={`w-full h-12 pl-12 pr-4 rounded-xl bg-white border outline-none transition-all placeholder:text-gray-300 focus:ring-2 ${inputErrorClass}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Confirmar Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock_clock</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-[#e3e0de] outline-none transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{isRegistering ? 'Criar Conta' : 'Acessar Sistema'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-text-muted">
              {isRegistering ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setHasError(false);
                }}
                className="text-primary font-bold hover:underline"
              >
                {isRegistering ? 'Faça Login' : 'Cadastre-se'}
              </button>
            </p>
          </div>

          <div className="pt-10 border-t border-[#e3e0de] text-center md:text-left flex justify-between items-center">
            <p className="text-xs text-text-muted">© 2026 Gabriela Mari.</p>
            <div className="flex gap-4">
              <a href="#" onClick={handlePrivacyClick} className="text-xs text-text-muted hover:text-primary transition-colors">Privacidade</a>
              <a href="#" onClick={handleTermsClick} className="text-xs text-text-muted hover:text-primary transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSuccessClose}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-fade-in text-center">
            <div className="bg-green-50 p-4 rounded-full inline-flex mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
            </div>
            <h3 className="font-serif font-bold text-2xl text-text-main mb-3">Cadastro Realizado</h3>
            <p className="text-text-muted mb-6">
              Cadastro Realizado com Sucesso - Um e-mail foi enviado para autenticar sua conta
            </p>
            <button
              onClick={handleSuccessClose}
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              Voltar para Login
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForgotModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="bg-primary/10 p-3 rounded-full inline-flex mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
              </div>
              <h3 className="font-serif font-bold text-xl text-text-main">Recuperar Senha</h3>
              <p className="text-text-muted text-sm mt-1">Digite seu email para receber um link de redefinição.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                  placeholder="Seu email cadastrado"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full h-10 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center"
              >
                {resetLoading ? 'Enviando...' : 'Enviar Email'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full h-10 text-text-muted hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;