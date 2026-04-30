import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/screens/LoginScreenStyles";
import { colors } from "../utils/theme";
import { useAppContext } from "../context/AppContext";
import { Role } from "../utils/types";

export default function LoginScreen() {
  const { login, registerUser } = useAppContext();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("User");

  const handleSubmit = async () => {
    if (!name.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter both name and password.");
      return;
    }
    if (mode === "login") {
      const result = await login(name, password);
      if (!result.ok) Alert.alert("Login failed", result.error);
      return;
    }
    const result = await registerUser(name, password, role);
    if (!result.ok) Alert.alert("Registration failed", result.error);
  };

  return (
    <View style={styles.background}>
      <View style={styles.topSection}>
        <View style={styles.glow} />
        <View style={styles.glowSecondary} />
        <Text style={styles.appName}>Expense Atlas</Text>
        <Text style={styles.heroTitle}>
          {mode === "login" ? "Welcome\nback." : "Create\naccount."}
        </Text>
        <Text style={styles.heroSub}>
          {mode === "login"
            ? "Track every spend, stay under every limit."
            : "Join Expense Atlas and take control of your budget."}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.cardWrapper}
      >
        <View style={styles.card}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {mode === "register" ? (
            <>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>
                Account Role
              </Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleButton, role === "User" && styles.roleButtonActive]}
                  onPress={() => setRole("User")}
                >
                  <Ionicons name="person" size={16} color={role === "User" ? "#fff" : colors.textMuted} />
                  <Text style={[styles.roleText, role === "User" && styles.roleTextActive]}>  User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === "Admin" && styles.roleButtonActive]}
                  onPress={() => setRole("Admin")}
                >
                  <Ionicons name="shield" size={16} color={role === "Admin" ? "#fff" : colors.textMuted} />
                  <Text style={[styles.roleText, role === "Admin" && styles.roleTextActive]}>  Admin</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>
              {mode === "login" ? "Log In" : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.link}>
            <Text style={styles.linkText}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.linkAction} onPress={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Register" : "Log In"}
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}