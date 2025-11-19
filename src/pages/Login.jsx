import React, { useState } from "react";
import { auth } from "../firebase";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import GoogleIcon from "@mui/icons-material/Google";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
    Box,
    Button,
    Typography,
    Alert,
    TextField,
    InputAdornment,
    IconButton,
    Divider,
    Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import InfoBlock from '../components/InfoBlock';

const Login = () => {
    const { user } = useAuth();
    const [authError, setAuthError] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Якщо користувач вже авторизований, перенаправляємо на головну
    if (user) {
        navigate("/");
        return null;
    }

    const handleGoogleLogin = async () => {
        setAuthError("");
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate("/calendar");
        } catch (error) {
            console.error("Google login error:", error);
            setAuthError("Помилка входу через Google. Спробуйте ще раз.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setAuthError("");
        
        // Валідація
        if (!email || !password) {
            setAuthError("Будь ласка, заповніть всі поля.");
            return;
        }

        if (isSignUp && !confirmPassword) {
            setAuthError("Будь ласка, підтвердіть пароль.");
            return;
        }

        if (password.length < 6) {
            setAuthError("Пароль повинен містити мінімум 6 символів.");
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setAuthError("Паролі не співпадають.");
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                // Реєстрація
                await createUserWithEmailAndPassword(auth, email, password);
                navigate("/calendar");
            } else {
                // Вхід
                await signInWithEmailAndPassword(auth, email, password);
                navigate("/calendar");
            }
        } catch (error) {
            console.error("Email auth error:", error);
            let errorMessage = "Помилка авторизації. Спробуйте ще раз.";
            let shouldAutoGoogleLogin = false;
            
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "Цей email вже зареєстровано через Google. Відкриваємо вікно входу...";
                    shouldAutoGoogleLogin = true;
                    break;
                case "auth/invalid-email":
                    errorMessage = "Невірний формат email.";
                    break;
                case "auth/weak-password":
                    errorMessage = "Пароль занадто слабкий. Використовуйте мінімум 6 символів.";
                    break;
                case "auth/user-not-found":
                    errorMessage = "Користувача з таким email не знайдено.";
                    break;
                case "auth/wrong-password":
                    errorMessage = "Невірний пароль.";
                    break;
                case "auth/invalid-credential":
                    errorMessage = "Невірний email або пароль.";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Занадто багато спроб. Спробуйте пізніше.";
                    break;
                default:
                    errorMessage = error.message || "Помилка авторизації. Спробуйте ще раз.";
            }
            
            setAuthError(errorMessage);
            
            // Якщо email вже зареєстровано через Google, автоматично викликаємо Google login
            if (shouldAutoGoogleLogin) {
                setTimeout(async () => {
                    try {
                        setLoading(true);
                        const provider = new GoogleAuthProvider();
                        await signInWithPopup(auth, provider);
                        navigate("/calendar");
                    } catch (googleError) {
                        console.error("Auto Google login error:", googleError);
                        setAuthError("Не вдалося автоматично увійти через Google. Спробуйте натиснути кнопку Google вручну.");
                        setLoading(false);
                    }
                }, 1500);
            } else {
                setLoading(false);
            }
        }
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            py: 4
        }}>
            <InfoBlock 
                icon={<LockIcon color="primary" sx={{ fontSize: 32 }} />} 
                title={isSignUp ? "Реєстрація" : "Вхід до системи"} 
                bgcolor="#e3f2fd"
                sx={{ maxWidth: 400, width: '100%' }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Форма email/password */}
                    <Box component="form" onSubmit={handleEmailAuth} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: '#fff' }}
                        />
                        
                        <TextField
                            label="Пароль"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            fullWidth
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: '#fff' }}
                        />

                        {isSignUp && (
                            <TextField
                                label="Підтвердження паролю"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                fullWidth
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                                disabled={loading}
                                            >
                                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ bgcolor: '#fff' }}
                            />
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading}
                            sx={{
                                bgcolor: '#1976d2',
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                boxShadow: 2,
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                    boxShadow: 4,
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {loading ? "Завантаження..." : (isSignUp ? "Зареєструватися" : "Увійти")}
                        </Button>
                    </Box>

                    {/* Перемикач між входом та реєстрацією */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {isSignUp ? "Вже маєте акаунт? " : "Немає акаунта? "}
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setAuthError("");
                                    setEmail("");
                                    setPassword("");
                                    setConfirmPassword("");
                                }}
                                sx={{ cursor: 'pointer', textDecoration: 'none' }}
                                disabled={loading}
                            >
                                {isSignUp ? "Увійти" : "Зареєструватися"}
                            </Link>
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }}>
                        <Typography variant="body2" color="text.secondary">або</Typography>
                    </Divider>

                    {/* Кнопка Google */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            sx={{
                                bgcolor: '#4285F4',
                                color: '#fff',
                                width: 56,
                                height: 56,
                                boxShadow: 3,
                                '&:hover': {
                                    bgcolor: '#357ae8',
                                    boxShadow: 6,
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                                '&:disabled': {
                                    bgcolor: '#ccc',
                                },
                            }}
                            title="Увійти через Google"
                        >
                            <GoogleIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                    </Box>

                    {authError && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                width: '100%',
                                borderRadius: 2
                            }}
                            onClose={() => setAuthError("")}
                        >
                            {authError}
                        </Alert>
                    )}
                </Box>
            </InfoBlock>
        </Box>
    );
};

export default Login;
