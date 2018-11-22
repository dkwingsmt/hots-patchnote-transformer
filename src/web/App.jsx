import React from 'react';
import PropTypes from 'prop-types';
import SVGInline from 'react-svg-inline';

import GithubIcon from 'simple-icons/icons/github';

import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Form from './Form';
import packageJson from '../../package.json';

const jssClasses = {

  body: {
    maxWidth: 768,
    margin: 'auto',
    marginTop: 20,
  },

  toolbarTitle: {
    flexGrow: 1,
  },

  toolbarIcon: {
    height: 24,
    width: 24,
    fill: 'white',
  },

  description: {
    maxWidth: 512,
    margin: 'auto',
    marginTop: 30,
    padding: 20,
    border: '1px solid #eee',
  },
};

function App({ classes }) {
  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="title"
            color="inherit"
            className={classes.toolbarTitle}
          >
            风暴英雄更新日志转换器
          </Typography>

          <IconButton
            aria-label="GitHub"
            href={packageJson.repository.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SVGInline
              svg={GithubIcon.svg}
              className={classes.toolbarIcon}
            />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Grid container className={classes.body}>
        <Form />
        <div className={classes.description}>
          <Typography variant="title" gutterBottom>
            说明
          </Typography>
          <Typography>
            本工具获取目标地址的《风暴英雄》更新日志，并将其转换为 bbs.nga.com 能使用的论坛代码的形式。
          </Typography>
        </div>
      </Grid>

    </div>
  );
}

App.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withStyles(jssClasses)(App);
