import { Redirect } from 'expo-router'
// Root entry redirects to the auth/app switch logic in _layout.tsx.
export default function Index() {
  return <Redirect href="/(auth)/login" />
}
