import React, { useState } from 'react';
import { GoogleIcon, FacebookIcon, LogoIcon } from '../ui/Icons.tsx';
import Spinner from '../ui/Spinner.tsx';
import { 
    signInWithGoogle, 
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
} from '../../services/auth.ts';

const LoginPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLoginView) {
                await signInWithEmail({ email, password });
                // onAuthStateChange in useAuth.ts will handle the login state
            } else {
                const result = await signUpWithEmail({ email, password });
                setMessage(result.message);
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="w-full h-full bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto animate-fade-in-up">
                <div className="text-center mb-8">
                    <LogoIcon className="w-20 h-20 text-blue-400 mx-auto" />
                    <h1 className="text-4xl font-bold mt-2">Radar Urbano</h1>
                    <p className="text-gray-400 mt-1">
                        {isLoginView ? 'Entre para continuar' : 'Crie sua conta para começar'}
                    </p>
                </div>
                
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        {message && <p className="text-green-400 text-sm text-center">{message}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center transition-colors disabled:bg-gray-500"
                        >
                            {loading ? <Spinner /> : (isLoginView ? 'Entrar' : 'Criar Conta')}
                        </button>
                    </form>
                    
                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-t border-gray-600" />
                        <span className="mx-4 text-gray-500 text-sm">OU</span>
                        <hr className="flex-grow border-t border-gray-600" />
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full bg-white text-gray-800 font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
                        >
                            <GoogleIcon />
                            <span>Entrar com Google</span>
                        </button>
                        <button
                            onClick={signInWithFacebook}
                            disabled={true}
                            className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                            title="Login com Facebook em breve!"
                        >
                            <FacebookIcon className="text-white"/>
                            <span>Entrar com Facebook</span>
                        </button>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <button onClick={() => { setIsLoginView(!isLoginView); setError(null); setMessage(null); }} className="text-blue-400 hover:text-blue-300">
                        {isLoginView ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Entre'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;