import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { Role } from "../utils/types";
import { colors, fonts, radii, shadow } from "../utils/theme";

export default function LoginScreen() {
  const { login, registerUser } = useAppContext();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("User");

  const handleSubmit = async () => {
    if (mode === "login") {
      const result = await login(name, password);
      if (!result.ok) {
        Alert.alert("Login failed", result.error);
      }
      return;
    }
    const result = await registerUser(name, password, role);
    if (!result.ok) {
      Alert.alert("Registration failed", result.error);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.topSection}>
        <View style={styles.glow} />
        <Text style={styles.appName}>Expense Atlas</Text>
        <Text style={styles.heroTitle}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </Text>
        <Text style={styles.heroSub}>
          Track every spend, stay under every limit.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.cardWrapper}
      >
        <View style={styles.card}>
          <TextInput
            placeholder="Name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          {mode === "register" ? (
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "User" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("User")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "User" && styles.roleTextActive,
                  ]}
                >
                  User
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "Admin" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("Admin")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "Admin" && styles.roleTextActive,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>
              {mode === "login" ? "Login" : "Register"}
            </Text>
          </TouchableOpacity>

          <View style={styles.link}>
            <Text style={styles.linkText}>
              {mode === "login" ? "Need an account? " : "Have an account? "}
              <Text
                style={styles.linkAction}
                onPress={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Register" : "Login"}
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 24,
  },
  glow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 212, 106, 0.12)",
  },
  appName: {
    fontFamily: fonts.body,
    color: colors.accent,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: fonts.heading,
    fontWeight: "700",
    color: "#fff",
  },
  heroSub: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    marginTop: 6,
    fontSize: 14,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 22,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
    ...shadow.lift,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.surfaceMuted,
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 15,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#fff",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: "center",
    marginTop: 4,
    ...shadow.soft,
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: fonts.body,
    fontSize: 15,
  },
  link: {
    alignItems: "center",
    marginTop: 14,
  },
  linkText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  linkAction: {
    color: colors.accent,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
