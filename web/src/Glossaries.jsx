
import React, { useState, useReducer, useRef, useCallback, useMemo } from 'react';
import _ from 'lodash';
import fuzz from 'fuzzball';

import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { Table, TableCell, TableBody, TableRow } from '@material-ui/core';

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
        cutoff: 20,
      }
    ),
    ([result, score, key]) => result,
  );
}

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
                    <TableCell>
                      {result[0]}
                    </TableCell>
                    <TableCell>
                      {result[1]}
                    </TableCell>
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