import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../styles/screens/LoginScreenStyles";
import { colors } from "../utils/theme";
import { useAppContext } from "../context/AppContext";
import { Role } from "../utils/types";

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

