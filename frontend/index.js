/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setupBackgroundHandler } from './src/services/pushNotification';

// Register FCM background handler (must be at top level)
setupBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);

