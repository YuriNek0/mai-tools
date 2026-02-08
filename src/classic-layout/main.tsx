/**
 * A tool that takes DX score data, converts that to FiNALE score
 * (achievement rate, break distribution, etc.), and displays it
 * in old maimai-NET style.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

import {RootComponent} from './components/RootComponent';
import './css/styles.css';

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<RootComponent />);
