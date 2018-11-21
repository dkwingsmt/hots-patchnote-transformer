/* global document */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './web/App';
// tslint:disable-next-line:no-import-side-effect
import './web/index.css';
import * as serviceWorker from './web/serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
