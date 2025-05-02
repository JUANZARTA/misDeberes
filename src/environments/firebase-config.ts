// Configuración de Firebase para inicializar la app

import firebase from 'firebase/compat/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBzluPST056-3rTmei5t38M6GaF9CNCo2Q',
  authDomain: 'micartera-acd5b.firebaseapp.com',
  databaseURL: 'https://micartera-acd5b-default-rtdb.firebaseio.com',
  projectId: 'micartera-acd5b',
  storageBucket: 'micartera-acd5b.appspot.com',
  messagingSenderId: '225559381755',
  appId: 'AIzaSyBzluPST056-3rTmei5t38M6GaF9CNCo2Q', // Este te aparece en configuración de Firebase
  measurementId: 'TU_MEASUREMENT_ID' // Opcional
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
