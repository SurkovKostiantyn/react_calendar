import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db, auth } from "../../firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
} from "firebase/firestore";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Відстеження авторизації користувача
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Завантаження подій з Firestore
    useEffect(() => {
        const fetchEvents = async () => {
            if (loading || !user) return;

            try {
                const q = query(
                    collection(db, "events"),
                    where("userId", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);
                const fetchedEvents = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    title: "", // Порожній текст для кастомного рендеру
                    start: doc.data().start,
                    allDay: true,
                }));
                setEvents(fetchedEvents);
            } catch (error) {
                console.error("Error fetching events:", error.message);
            }
        };

        fetchEvents();
    }, [user, loading]);

    // Обробка кліку по даті
    const handleDateClick = async (info) => {
        if (!user) {
            alert("Please log in to interact with the calendar.");
            return;
        }

        if (!auth.currentUser) {
            alert("Вы не авторизованы.");
            return;
        }

        try {
            const q = query(
                collection(db, "events"),
                where("start", "==", info.dateStr),
                where("userId", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                await deleteDoc(doc(db, "events", docId));
                setEvents(events.filter((event) => event.id !== docId));
            } else {
                const newEvent = { title: "", start: info.dateStr, userId: user.uid };
                const docRef = await addDoc(collection(db, "events"), newEvent);
                setEvents([...events, { id: docRef.id, ...newEvent }]);
            }
        } catch (error) {
            console.error("Error handling date click:", error.message);
        }
    };

    // Кастомний рендер подій з використанням MUI-іконки
    const renderEventContent = () => {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";
        container.style.height = "100%";
        container.style.width = "100%";

        const rootDiv = document.createElement("div");
        container.appendChild(rootDiv);
        ReactDOM.createRoot(rootDiv).render(
            <LocalBarIcon sx={{ color: "#FF5722", fontSize: 24 }} />
        );

        return { domNodes: [container] };
    };

    return (
        <Box sx={{ p: 2 }}>
            {loading ? (
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
            ) : user ? (
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    eventContent={renderEventContent}
                    height="auto"
                />
            ) : (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    Please log in to access the calendar.
                </Box>
            )}
        </Box>
    );
};

export default Calendar;
