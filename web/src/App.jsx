import React from 'react';
import PropTypes from 'prop-types';
import SVGInline from 'react-svg-inline';
import { BrowserRouter as Router, Route, NavLink } from "react-router-dom";

import GithubIcon from 'simple-icons/icons/github';

import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Form from './Form';
import Glossaries from './Glossaries';
import { Button } from '@material-ui/core';

const repoUrl = 'https://github.com/dkwingsmt/hots-patchnote-transformer';

const jssClasses = {

  body: {
    maxWidth: 768,
    margin: 'auto',
    marginTop: 20,
  },

  toolbarTitle: {
    marginRight: 30,
  },

  toolbarFill: {
    flexGrow: 1,
  },

  toolbarIconLink: {
    textDecoration: 'none',
  },

  toolbarIcon: {
    height: 24,
    width: 24,
    fill: 'white',
  },

  toolbarButton: {
    color: 'white',
    marginRight: 20,
  },

  activeLink: {
    '& > $toolbarButton': {
      color: 'rgba(255, 170, 170, 0.8)',
    },
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
    <Router>
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
            <NavLink
              to="/"
              exact
              className={classes.toolbarIconLink}
              activeClassName={classes.activeLink}
            >
              <Button className={classes.toolbarButton}>
                转换网页
              </Button>
            </NavLink>
            <NavLink
              to="/glossaries"
              exact
              className={classes.toolbarIconLink}
              activeClassName={classes.activeLink}
            >
              <Button className={classes.toolbarButton}>
                查找术语
              </Button>
            </NavLink>

            <div
              className={classes.toolbarFill}
            />
            <IconButton
              aria-label="GitHub"
              href={repoUrl}
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
        <Route path="/" exact component={Form} />
        <Route path="/glossaries" component={Glossaries} />
      </div>
    </Router>
  );
}

App.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withStyles(jssClasses)(App);
