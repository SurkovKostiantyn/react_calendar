import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    CircularProgress,
    Grid,
} from "@mui/material";

// Імпорт компонента для прив’язки email/паролю
import LinkEmailPassword from "./LinkEmailPassword.jsx"; //

const Login = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // стан завантаження
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();

    // Відстеження стану авторизації
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Вхід через Google
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate("/calendar");
        } catch (error) {
            setAuthError("Помилка входу через Google. Спробуйте ще раз.");
        }
    };

    // Вхід через email/пароль
    const handleEmailLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/calendar");
        } catch (error) {
            setAuthError("Помилка входу. Перевірте дані та спробуйте ще раз.");
        }
    };

    // Реєстрація через email/пароль з підтвердженням паролю
    const handleRegister = async () => {
        // Перевірка співпадіння паролів
        if (password !== confirmPassword) {
            setAuthError("Паролі не співпадають.");
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/calendar");
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                setAuthError("Ця електронна адреса вже використовується.");
            } else {
                setAuthError("Помилка реєстрації. Перевірте дані та спробуйте ще раз.");
            }
        }
    };

    // Вихід з аккаунту
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            setAuthError("Помилка виходу. Спробуйте ще раз.");
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress sx={{ color: "#4285F4" }} />
            </Box>
        );
    }

    if (user) {
        // Перевірка, чи прив'язаний метод "email/password"
        const hasPasswordProvider = user.providerData.some(
            (provider) => provider.providerId === "password"
        );
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Вітаємо, {user.email}
                </Typography>
                {/* Якщо акаунт увійшов через Google і не має прив'язаного email/паролю */}
                {!hasPasswordProvider && (
                    <>
                        <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                            Ваш акаунт увійшов через Google. Ви можете об’єднати його з email/паролем:
                        </Typography>
                        <LinkEmailPassword />
                    </>
                )}
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ mt: 2 }}
                >
                    Вийти
                </Button>
            </Box>
        );
    }

    return (
        <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
            <Grid item xs={11} sm={8} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" align="center" gutterBottom>
                            {isRegistering ? "Реєстрація" : "Вхід до системи"}
                        </Typography>

                        {/* Вхід через Google */}
                        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                            <Button variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleLogin}>
                                Вхід через Google
                            </Button>
                        </Box>

                        {/* Форма введення email та паролю */}
                        <TextField
                            fullWidth
                            label="Email"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            label="Пароль"
                            type="password"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {/* Поле підтвердження паролю відображається лише при реєстрації */}
                        {isRegistering && (
                            <TextField
                                fullWidth
                                label="Підтвердіть пароль"
                                type="password"
                                margin="normal"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        )}

                        {authError && (
                            <Typography color="error" align="center" sx={{ mt: 1 }}>
                                {authError}
                            </Typography>
                        )}

                        {/* Головна кнопка залежно від режиму */}
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={isRegistering ? handleRegister : handleEmailLogin}
                            >
                                {isRegistering ? "Зареєструватися" : "Увійти"}
                            </Button>
                        </Box>

                        {/* Текст-кнопка для перемикання між режимами */}
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <Button
                                onClick={() => {
                                    setAuthError("");
                                    setIsRegistering(!isRegistering);
                                }}
                            >
                                {isRegistering
                                    ? "Вже маєте аккаунт? Увійдіть"
                                    : "Немаєте аккаунту? Зареєструйтеся"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default Login;
