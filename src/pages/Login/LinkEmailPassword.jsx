import React, { useState } from "react";
import { auth } from "../../firebase";
import { EmailAuthProvider } from "firebase/auth";
import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";

const LinkEmailPassword = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [linkMessage, setLinkMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleLinkAccount = async () => {
        setLinkMessage("");
        setErrorMessage("");

        if (!auth.currentUser) {
            setErrorMessage("Користувач не авторизований.");
            return;
        }

        if (!email || !password) {
            setErrorMessage("Будь ласка, введіть email та пароль.");
            return;
        }

        const credential = EmailAuthProvider.credential(email, password);
        try {
            await auth.currentUser.linkWithCredential(credential);
            setLinkMessage("Акаунти успішно об'єднані.");
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                setErrorMessage("Цей email уже використовується іншим акаунтом.");
            } else {
                setErrorMessage("Сталася помилка під час об’єднання акаунтів.");
            }
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Card sx={{ width: "100%", maxWidth: 400 }}>
                <CardContent>
                    <Typography variant="h6" align="center" gutterBottom>
                        Об'єднати акаунти
                    </Typography>
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
                    {errorMessage && (
                        <Typography color="error" align="center" sx={{ mt: 1 }}>
                            {errorMessage}
                        </Typography>
                    )}
                    {linkMessage && (
                        <Typography color="primary" align="center" sx={{ mt: 1 }}>
                            {linkMessage}
                        </Typography>
                    )}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Button variant="contained" color="primary" onClick={handleLinkAccount}>
                            Об'єднати акаунти
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LinkEmailPassword;
