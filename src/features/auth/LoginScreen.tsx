import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from "react-native";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../config/firebase";
import { colors, buttons } from "../../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";

const REMEMBER_LOGIN_KEY = "hunterRememberLogin";

type RememberedLogin = {
    email: string;
};

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const loadRememberedLogin = async () => {
            try {
                const savedLogin = await AsyncStorage.getItem(REMEMBER_LOGIN_KEY);

                if (!savedLogin) return;

                const parsedLogin = JSON.parse(savedLogin) as Partial<RememberedLogin> & {
                    password?: string;
                };

                if (parsedLogin?.email && !parsedLogin?.password) {
                    setEmail(parsedLogin.email);
                    setRememberMe(true);
                    return;
                }

                await AsyncStorage.removeItem(REMEMBER_LOGIN_KEY);
            } catch {
                await AsyncStorage.removeItem(REMEMBER_LOGIN_KEY);
            }
        };

        loadRememberedLogin();
    }, []);

    const handleLogin = async () => {
        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
            setError("Enter email and password.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const cred = await signInWithEmailAndPassword(
                auth,
                cleanEmail,
                password
            );

            const uid = cred.user.uid;

            const userSnap = await getDoc(doc(db, "users", uid));

            if (!userSnap.exists()) {
                setError("User profile missing.");
                return;
            }

            const data = userSnap.data();
            const role = data?.role;
            const hasCompleted = data?.hasCompletedPreferences;

            if (rememberMe) {
                await AsyncStorage.setItem(
                    REMEMBER_LOGIN_KEY,
                    JSON.stringify({
                        email: cleanEmail,
                    })
                );
            } else {
                await AsyncStorage.removeItem(REMEMBER_LOGIN_KEY);
            }

            if (role === "renter") {
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: hasCompleted
                                ? "RenterTabs"
                                : "RenterPreferencesScreen",
                        },
                    ],
                });
            } else if (role === "landlord") {
                navigation.reset({
                    index: 0,
                    routes: [{ name: "LandlordTabs" }],
                });
            } else {
                setError("User role not found.");
            }
        } catch (e: any) {
            setError(e?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Image
                        source={require("../../../assets/logo-icon-purple.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>Welcome back</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        placeholderTextColor="#A0A0A0"
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#A0A0A0"
                        />

                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? "eye-off" : "eye"}
                                size={22}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.rememberRow}
                        onPress={() => setRememberMe(!rememberMe)}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                rememberMe && styles.checkboxSelected,
                            ]}
                        >
                            {rememberMe && (
                                <Text style={styles.checkboxMark}>✓</Text>
                            )}
                        </View>

                        <Text style={styles.rememberText}>Remember Me</Text>
                    </TouchableOpacity>

                    {error && <Text style={styles.error}>{error}</Text>}

                    {/* BUTTON */}
                    <TouchableOpacity
                        style={buttons.primary}
                        onPress={handleLogin}
                    >
                        <Text style={buttons.primaryText}>
                            {loading ? "Signing in..." : "Login"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("Signup")}
                        style={styles.signupContainer}
                    >
                        <Text style={styles.link}>
                            Don't have an account? Sign up
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
    },
    card: {
        width: "100%",
    },
    logo: {
        width: 90,
        height: 90,
        alignSelf: "center",
        marginBottom: 18,
    },
    title: {
        fontSize: 30,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 28,
        color: "#111827",
        letterSpacing: -0.5,
    },
    input: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 14,
        marginBottom: 12,
        fontSize: 16,
        color: "#111827",
        textAlignVertical: "center",
        includeFontPadding: false,
    },

    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        borderRadius: 14,
        marginBottom: 12,
        paddingHorizontal: 18,
    },

    passwordInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: "#111827",
    },

    rememberRow: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 2,
        marginBottom: 14,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#9CA3AF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    checkboxSelected: {
        backgroundColor: colors.deepPurple,
        borderColor: colors.deepPurple,
    },
    checkboxMark: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
        lineHeight: 18,
    },
    rememberText: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "600",
    },

    error: {
        color: "#DC2626",
        marginBottom: 10,
        marginTop: 4,
    },
    signupContainer: {
        marginTop: 18,
        alignItems: "center",
    },
    link: {
        color: colors.primaryBlue,
        fontSize: 13,
        fontWeight: "600",
    },
});
