
import React, { useState, useReducer, useRef, useCallback, useMemo } from 'react';
import _ from 'lodash';
import fuzz from 'fuzzball';
import copy from 'copy-to-clipboard';

import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { Table, TableCell, TableBody, TableRow } from '@material-ui/core';

import FileCopy from '@material-ui/icons/FileCopy';

import { i18n } from '@html2nga/hots-transform';

const jssClasses = {
  body: {
    maxWidth: 768,
    margin: 'auto',
    marginTop: 20,
  },

  textfield: {
    width: '100%',
    marginBottom: 10,
  },
};

const findResults = (choices) => (text) => {
  if (text.length <= 2)
    return [];
  return _.map(
    fuzz.extract(
      text,
      choices,
      {
        processor: (choice) => choice[0] + " " + choice[1],
        limit: 10,
        cutoff: 40,
      }
    ),
    ([result, score, key]) => result,
  );
}

function _CopiableCell({ text, classes }) {
  return (
    <TableCell
      className={classes.cell}
    >
      <div className={classes.cellBlock}>
        <div className={classes.text}>
          {text}
        </div>
        <div className={classes.button}>
          <IconButton
            size="small"
            onClick={() => {
              copy(text);
            }}
          >
            <FileCopy />
          </IconButton>
        </div>
      </div>
    </TableCell>
  )
}

const copiableCellStyles = {
  cell: {
    '&:not(:hover) $button': {
      display: 'none',
    },

    '&:hover': {
      backgroundColor: 'rgba(50, 50, 127, 0.05)',
    },
  },

  cellBlock: {
    display: 'flex',
    alignItems: 'center',
  },

  text: {
    flex: '1 1 0',
  },

  button: {
    flex: '0 0 auto',
    zoom: 0.7,
    margin: -20,
  },
}

const CopiableCell = withStyles(copiableCellStyles)(_CopiableCell);

function _Glossaries({ classes }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const searchFunc = useRef(null);
  if (searchFunc.current == null) {
    const choices = _.toPairs(i18n);
    searchFunc.current = findResults(choices);
  }

  const displayNormalTable = results.length > 0;

  return (
    <Grid container className={classes.body}>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          className={classes.textfield}
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            setResults(searchFunc.current(nextText));
          }}
          value={text}
          placeholder='输入术语查找翻译……'
        />
        {text.length > 2 && (
          <Table>
            {displayNormalTable && (
              <colgroup>
                <col style={{width:'60%'}}/>
                <col style={{width:'40%'}}/>
              </colgroup>
            )}
            <TableBody>
              {displayNormalTable ? (
                results.map((result) => (
                  <TableRow key={result[0]}>
                    <CopiableCell
                      text={result[0]}
                    />
                    <CopiableCell
                      text={result[1]}
                    />
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>
                    没有找到匹配的术语
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Grid>
    </Grid>
  );
}

export default withStyles(jssClasses)(_Glossaries);