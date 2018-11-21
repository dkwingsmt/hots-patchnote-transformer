/* global fetch */
import React, { useState, useReducer, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';
import jsonp from 'jsonp';

import { Button } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import { pageToBbsCode } from '../transformer';

function transform(s, url) {
  return pageToBbsCode({
    htmlText: s,
    url,
  });
}

const jssClasses = {
  optionSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: 10,
  },

  rightOption: {
  },

  textFieldTransformedInput: {
    maxHeight: '20em',
  },

  textFieldTransformed: {
  },

  errorSection: {
    backgroundColor: '#f00',
    color: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
};

const loaderInitState = {
  loading: false,
  error: null,
  raw: null,
  url: null,
  taskId: 0,
};

function loaderReducer(state, action) {
  switch (action.type) {
  case 'START':
    return {
      ...state,
      loading: true,
      error: null,
      raw: null,
      url: action.url,
      taskId: action.taskId,
    };

  case 'ERROR':
    if (action.taskId !== state.taskId) {
      console.warn('TaskId unmatched', action.taskId, state.taskId);
      return state;
    }
    return {
      ...state,
      loading: false,
      error: action.error,
      raw: null,
      url: null,
    };

  case 'RESOLVE':
    if (action.taskId !== state.taskId) {
      console.warn('TaskId unmatched', action.taskId, state.taskId);
      return state;
    }
    return {
      ...state,
      loading: false,
      error: null,
      raw: action.result,
    };

  case 'CLEAR_ERROR':
    if (action.taskId !== state.taskId) {
      console.warn('TaskId unmatched', action.taskId, state.taskId);
      return state;
    }
    return {
      ...state,
      error: null,
    };

  default:
    return state;
  }
}

function assertValidUrl() {

}

function constructProxyUrl(url) {
  return `http://www.whateverorigin.org/get?url=${encodeURIComponent(url)}`;
}

async function fetchWithJsonp(url, options) {
  return new Promise((resolve, reject) => {
    jsonp(url, options, (e, d) => {
      if (e) {
        reject(e);
      } else {
        resolve(d);
      }
    });
  });
}

function Form({ classes }) {
  const [url, changeUrl] = useState('');
  const [loaderState, loaderDispatch] = useReducer(
    loaderReducer,
    loaderInitState,
  );
  const transformedRef = useRef(null);
  const memoTransform = useCallback(transform);

  async function start() {
    const myTaskId = loaderState.taskId + 1;
    loaderDispatch({
      type: 'START',
      url,
      taskId: myTaskId,
    });

    try {
      assertValidUrl(url);
      const proxyUrl = constructProxyUrl(url);
      const response = await fetchWithJsonp(proxyUrl);
      loaderDispatch({
        type: 'RESOLVE',
        result: response.contents,
        taskId: myTaskId,
      });
    } catch (e) {
      loaderDispatch({
        type: 'ERROR',
        error: e,
        taskId: myTaskId,
      });
    }
  }

  return (
    <Grid item xs={12}>
      <TextField
        key="url"
        inputProps={{
          className: classes.urlTextfieldInput,
        }}
        className={classes.urlTextfield}
        fullWidth
        label="更新日志URL"
        placeholder="例如：https://heroesofthestorm.com/en-us/blog/..."
        value={url}
        onChange={(evt) => {
          changeUrl(evt.target.value);
        }}
        onKeyDown={(evt) => {
          if (keycode.isEventKey(evt, 'enter')) {
            start();
          }
        }}
      />
      <div key="options" className={classes.optionSection}>
        <div className={classes.rightOption}>
          <Button
            variant="contained"
            color="primary"
            onClick={start}
            disabled={loaderState.loading}
            classes={{
            }}
          >
            {
              loaderState.loading ?
                '获取中……' :
                '转换（回车）'
            }
          </Button>
        </div>
      </div>
      {loaderState.error && (
        <div key="error" className={classes.errorSection} >
          {loaderState.error.toString()}
        </div>
      )}
      <TextField
        key="transformed"
        inputProps={{
          ref: transformedRef,
          className: classes.textFieldTransformedInput,
        }}
        readOnly
        variant="outlined"
        multiline
        fullWidth
        className={classes.textFieldTransformed}
        label="转换后"
        placeholder="这里将显示转换后的文字"
        value={loaderState.raw ? memoTransform(loaderState.raw, loaderState.url) : ''}
      />
    </Grid>
  );
}

Form.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withStyles(jssClasses)(Form);
