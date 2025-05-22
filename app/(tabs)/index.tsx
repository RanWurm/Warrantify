// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { auth } from '../../constants/customAuth';
import { onAuthStateChanged, User } from '../../constants/customAuth';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; // or splash screen
  }

  if (currentUser) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/login" />;
  }
}
