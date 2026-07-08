import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";

import { auth, db } from "../../config/firebase";
import { colors, buttons } from "../../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen({ navigation }: any) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"renter" | "landlord" | null>(null);

    const [showPasswordRules, setShowPasswordRules] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const validatePassword = (pwd: string) => {
        const hasLetter = /[A-Za-z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        return pwd.length >= 8 && hasLetter && hasNumber && hasSpecial;
    };

    const handleSignup = async () => {
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanName = `${cleanFirstName} ${cleanLastName}`.trim();
        const cleanEmail = email.trim();

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanEmail ||
            !password ||
            !confirmPassword ||
            !role
        ) {
            setError("Fill all fields and select account type.");
            return;
        }

        if (!validatePassword(password)) {
            setError("Password does not meet requirements.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userCredential =
                await createUserWithEmailAndPassword(auth, cleanEmail, password);

            const uid = userCredential.user.uid;

            const userPayload: any = {
                name: cleanName,
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail,
                phoneNumber: "",
                avatarUrl: "",
                role,
                createdAt: new Date().toISOString(),
            };

            if (role === "landlord") {
                userPayload.listingIDs = [];
            }

            const batch = writeBatch(db);

            batch.set(doc(db, "users", uid), userPayload);
            batch.set(doc(db, "sharedUsers", uid), {
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail,
                phoneNumber: "",
                avatarUrl: "",
            });

            await batch.commit();

            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        } catch (e: any) {
            setError(e?.message || "Signup failed");
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
                    <Text style={styles.title}>Create Account</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholderTextColor="#A0A0A0"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholderTextColor="#A0A0A0"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        placeholderTextColor="#A0A0A0"
                    />

                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                role === "renter" && styles.roleSelected,
                            ]}
                            onPress={() => setRole("renter")}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    role === "renter" && styles.roleTextActive,
                                ]}
                            >
                                Renter
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                role === "landlord" && styles.roleSelected,
                            ]}
                            onPress={() => setRole("landlord")}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    role === "landlord" && styles.roleTextActive,
                                ]}
                            >
                                Landlord
                            </Text>
                        </TouchableOpacity>
                    </View>

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

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            placeholderTextColor="#A0A0A0"
                        />

                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-off" : "eye"}
                                size={22}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.passwordHintContainer}
                        onPress={() =>
                            setShowPasswordRules(!showPasswordRules)
                        }
                    >
                        <Text style={styles.link}>Password requirements</Text>
                    </TouchableOpacity>

                    {showPasswordRules && (
                        <View style={styles.rules}>
                            <Text style={styles.ruleText}>
                                • Minimum 8 characters
                            </Text>
                            <Text style={styles.ruleText}>
                                • At least 1 letter
                            </Text>
                            <Text style={styles.ruleText}>
                                • At least 1 number
                            </Text>
                            <Text style={styles.ruleText}>
                                • At least 1 special character
                            </Text>
                        </View>
                    )}

                    {error && <Text style={styles.error}>{error}</Text>}

                    <TouchableOpacity
                        style={buttons.primary}
                        onPress={handleSignup}
                    >
                        <Text style={buttons.primaryText}>
                            {loading ? "Creating..." : "Create account"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.link}>
                                Already have an account? Login
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.disclaimer}>
                        By signing up, I agree to Hunter Terms & Conditions and Privacy Policy.
                    </Text>
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

    title: {
        fontSize: 30,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 24,
        color: "#111827",
        letterSpacing: -0.5,
    },

    input: {
        backgroundColor: "#F3F4F6",
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        fontSize: 16,
        color: "#111827",
    },

    roleContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },

    roleButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
    },

    roleSelected: {
        backgroundColor: "#E5EBFB",
        borderWidth: 1,
        borderColor: colors.primaryBlue,
    },

    roleText: {
        color: "#6B7280",
        fontWeight: "500",
    },

    roleTextActive: {
        color: colors.primaryBlue,
        fontWeight: "700",
    },

    passwordHintContainer: {
        alignSelf: "flex-start",
        marginBottom: 8,
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

    link: {
        color: colors.primaryBlue,
        fontSize: 13,
        fontWeight: "600",
    },

    rules: {
        marginBottom: 10,
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 12,
    },

    ruleText: {
        fontSize: 13,
        color: "#4B5563",
    },

    error: {
        color: "#DC2626",
        marginTop: 10,
        marginBottom: 10,
    },

    loginContainer: {
        alignItems: "center",
        marginTop: 16,
    },

    disclaimer: {
        fontSize: 12,
        marginTop: 18,
        textAlign: "center",
        color: "#6B7280",
    },
});
