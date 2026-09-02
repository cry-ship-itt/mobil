# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Supabase backend

The app uses Supabase for authentication, companies, invites, machines, tickets, and real-time ticket notifications.

1. In Supabase Dashboard, enable **Anonymous sign-ins** under Authentication > Providers.
2. Open SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Keep the Supabase URL and publishable key in `.env.local`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your-publishable-key
   ```

4. Restart Expo after changing environment variables:

   ```bash
   npx expo start --clear
   ```

The maintenance dashboard subscribes to Supabase Realtime and shows an in-app alert when a new ticket is created. The app also registers Expo push tokens in `push_tokens`. To enable real phone notifications, run the updated `supabase/schema.sql`, then deploy `api/send-ticket-notification` as a Supabase Edge Function:

```bash
supabase functions deploy send-ticket-notification
```

The function uses the `SUPABASE_SERVICE_ROLE_KEY` secret automatically provided by Supabase and sends notifications through Expo Push Service. Push notifications require a physical device and an EAS development/release build; Android Expo Go cannot receive remote push notifications from SDK 53 onward. Configure Android FCM credentials and iOS push credentials in EAS before testing.

The `.env.local` file is ignored by Git and must be created separately on another computer.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
