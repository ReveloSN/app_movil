import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from '@/features/widget/widget.task-handler';

// Android abre el widget sin interfaz: el manejador tiene que estar registrado desde el arranque.
registerWidgetTaskHandler(widgetTaskHandler);
