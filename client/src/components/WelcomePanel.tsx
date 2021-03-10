import { Typography } from '@material-ui/core';
import Button from "@material-ui/core/Button";
import * as React from 'react';
import { useContext } from 'react';
import {
  accentColor,
  secondAccent,
  textColor,
  PageContainer,
  lighterBackground,
} from "../styles";
import styled, { css } from "styled-components";
import { ComputeDispatchContext } from '../state/ComputeStateManager';

const StyledButton = styled(Button)`
  color: accentColor;
  background: lighterBackground;
  border-width: thin;
  border-color: accentColor;

  &:hover {
    border-color: secondAccent;
  }
`

const project = 'zkopru';

const Acknowledge = ({ contribute }: { contribute: () => void}) => 
  (<div style={{ display: 'grid', paddingTop: '20px' }}>
    <StyledButton variant='outlined' onClick={contribute} 
      style={{color: accentColor, borderWidth: 'thin', borderColor: accentColor }}>
      Launch
    </StyledButton>
   </div>);

export default function WelcomePanel(props: any) {
  const dispatch = useContext(ComputeDispatchContext);
  const handleClick = () => {
    if (dispatch) dispatch({type: 'ACKNOWLEDGE' });
  }

  return (
  <div>
    <Typography variant='h2'>{project}</Typography>
    <Typography variant="body1" align="center">
      {`Trusted Setup Ceremony March, 2021`} 
    </Typography>
    <Typography variant="body1" align="center">
      {`Participate using your GitHub account.`} 
    </Typography>
    <Acknowledge contribute={handleClick} />
  </div>);
}