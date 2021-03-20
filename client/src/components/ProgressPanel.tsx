import { Box, Grid, LinearProgress, LinearProgressProps, Typography } from '@material-ui/core';
import * as React from 'react';
import { useContext } from 'react';
import {
  accentColor,
  secondAccent,
  textColor,
  PageContainer,
  lighterBackground,
  NormalBodyText,
  SubtleBody,
  subtleText,
  darkerBackground,
} from "../styles";
import { ComputeDispatchContext, ComputeStateContext, ComputeStatus, Step } from '../state/ComputeStateManager';
import { Player } from '@lottiefiles/react-lottie-player';
import styled from 'styled-components';
import VisibilitySensor from 'react-visibility-sensor';
import AttestationPanel from './AttestationPanel';
import { ContributionState } from '../types/ceremony';

const StyledHeader = styled.div`
  font-family: Inconsolata;
  font-style: normal;
  font-weight: bold;
  font-size: 48px;
  line-height: 140%;
  /* or 67px */

  display: flex;
  align-items: flex-end;

  /* Primary / Buttons */

  color: ${accentColor};
`

interface ProgressBarProps extends LinearProgressProps {
  size: string,
}

const StyledProgressBar = styled(LinearProgress).attrs((props: ProgressBarProps) => ({
  size: props.size || 'normal',
}))`
  padding-top: ${ ({ size }) => {return (size === 'small') ? '0px' : '5px';} }; 
  border-radius: 20px; 
  background-color: ${darkerBackground};
  border: 2px solid ${darkerBackground};
  width: ${ ({ size }) => { 
    if (size === 'normal') return '491px'; 
    else return 'default' } }; 

  & > .MuiLinearProgress-barColorPrimary {
    border-radius: 20px;
    background-color: ${accentColor};
    border-color: ${accentColor};
  }

  &.MuiLinearProgress-root.MuiLinearProgress-colorPrimary {
    background-color: ${darkerBackground};
  }
`;

const stepText = (step: Step, computeStatus: ComputeStatus): string => {
  switch (step) {
    case Step.ACKNOWLEDGED: 
    case Step.INITIALISED: 
    case Step.ENTROPY_COLLECTED: {
        return 'Preparing';
    }
    case Step.QUEUED: 
    case Step.WAITING: {
        return 'Waiting';
    }
    case Step.RUNNING: {
      if (!computeStatus.downloaded) return 'Downloading'
      else if (!computeStatus.computed) return 'Computing'
      else if (!computeStatus.uploaded) return 'Uploading'
      return '?';
    }
    default: return step.toString();
  }
}

const queueStatus = (contribState: ContributionState) => {
  const queue = contribState.queueIndex - contribState.currentIndex; 
  const dots = ' .'.repeat(queue);
  return (
    <div>
      <NormalBodyText>{`No. ${queue} in line`}</NormalBodyText>
      <div style={{ color: accentColor, textAlign: 'right' }}>{dots}</div>
    </div>
  );
};

interface ProgressProps {
  progressPct: number,
}

export const CeremonyProgress = (props: any) => {
  const state = useContext(ComputeStateContext);
  const { circuits, contributionCount, step, computeStatus } = state;
  const cctCount = circuits.length;
  const ceremonyPct = (cctCount>0) ? 100 * contributionCount / cctCount : 0;
  const { format } = props;

  const prefix = (format && format === 'bar') ?
    (<NormalBodyText>
      {`C${contributionCount+1} ${stepText(step, computeStatus)}`}
    </NormalBodyText>)
    :
    (<></>);

  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        {prefix}
        <StyledProgressBar 
          variant="determinate" 
          value={ceremonyPct} 
          size='normal'
        />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" style={{ color: subtleText }}>{`${Math.round(
            ceremonyPct
          )}%`}</Typography>
      </Box>
    </Box>
  );
}

const StepProgress = ({ progressPct }: ProgressProps) => {
  return (
    <StyledProgressBar variant="determinate" value={progressPct} size='small' />
  );
}

const Animation = () => {
  return (
    <Player autoplay
      loop
      src='./38853-circular-lines-02.json' 
      style={{ height: '419px', width: '423px' }}
      background='transparent'
    >
    </Player>
  );
}

const status = (state: any) => {
  const { circuits, contributionCount, contributionState, step, computeStatus, progress } = state;
  const cctCount = circuits.length;
  let header = '';
  let body1 = (<></>);
  let body2 = (<></>);
  if (step === Step.COMPLETE) {
    header = 'Contribution Complete.';
    body1 = (
      <div>
        <NormalBodyText>
        You've successfully contributed to {cctCount} circuits.
        </NormalBodyText>
        <br />
        <NormalBodyText>
        Thank you for participating!
        </NormalBodyText>
      </div>);
    body2 = (<AttestationPanel />);
  } else {
    let statusCell = (<></>);
    if (step === Step.QUEUED) {
      header = 'Your are in line.';
      statusCell = queueStatus(contributionState);
    } else {
      header = 'Contribution Active.';
      statusCell = (
        <div>
          {stepText(step, computeStatus)}
          <StepProgress progressPct={progress}/>
        </div>
      );
    }
    body1 = (
      <div>
        <NormalBodyText>
        ATTENTION:
        </NormalBodyText>
        <br />
        <NormalBodyText>
        Closing this browser window will interrupt your contribution.
        </NormalBodyText>
      </div>);
    body2 = (
      <div>
        <Grid item>
          <CeremonyProgress />
        </Grid>
        <Grid item container spacing={6} direction='row'>
          <Grid item container direction='column' style={{ width: '150px' }} >
            <Grid item style={{ height: '34px' }} >
              <SubtleBody>Circuit</SubtleBody>
            </Grid>
            <Grid item>
              <NormalBodyText>
                {contributionCount+1}/{cctCount}
              </NormalBodyText>
            </Grid>
          </Grid>
          <Grid item container direction='column' style={{ width: '150px' }} >
            <Grid item style={{ height: '34px' }} >
              <SubtleBody>Status</SubtleBody>
            </Grid>
            <Grid item>
              {statusCell}
            </Grid>
          </Grid>
        </Grid>
      </div>
    );
  }
  return { header, body1, body2 };
}

export default function ProgressPanel(props: any) {
  const state = useContext(ComputeStateContext);
  const dispatch = useContext(ComputeDispatchContext);

  const content = status(state);

  return (
    <div>
      <VisibilitySensor onChange={isVisible => {if (dispatch) dispatch({type:'VISIBILITY', data: isVisible})}}>
        <Grid container spacing={4} direction='row' style={{ display: 'flex' }} >
          <Grid item style={{ width: '45%' }} >
            <Animation />
          </Grid>
          <Grid item container direction='column' style={{ width: '55%' }} >
            <Grid item>
              <StyledHeader>
                {content.header}
              </StyledHeader>
            </Grid>
            <Grid item>
              {content.body1}
            </Grid>
            <Grid item>
              {content.body2}
            </Grid>
          </Grid>
        </Grid>
      </VisibilitySensor>
    </div>
  );
}

