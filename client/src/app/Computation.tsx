import React, { useState, useReducer, useRef } from "react";
import Typography from "@material-ui/core/Typography";
import { GetParamsFile, UploadParams } from "../api/FileApi";0
import { AuthContext } from "./AuthContext";

import { CeremonyEvent, ContributionState, ContributionSummary, Participant, ParticipantState } from "../types/ceremony";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import VirtualList from "../components/MessageList";
import Paper from "@material-ui/core/Paper";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import { addCeremonyEvent, addOrUpdateContribution, addOrUpdateParticipant, 
  ceremonyContributionListener, ceremonyQueueListener, ceremonyQueueListenerUnsub } from "../api/FirestoreApi";
import QueueProgress from '../components/QueueProgress';
import Divider from "@material-ui/core/Divider";


const createCeremonyEvent = (eventType: string, message: string, index: number | undefined): CeremonyEvent => {
  return {
    sender: "PARTICIPANT",
    index,
    eventType,
    timestamp: new Date(),
    message,
    acknowledged: false,
  };
};

const createContributionSummary = (participantId: string, status: ParticipantState, paramsFile: string, index: number, hash: string, duration: number): ContributionSummary => {
  return {
    lastSeen: new Date(),
    hash,
    paramsFile,
    index,
    participantId,
    status,
    timeCompleted: new Date(),
    duration,
  }
};

interface ComputeStatus {
  running: boolean,
  downloaded: boolean,
  started: boolean,
  computed: boolean,
  newParams: Uint8Array,
  uploaded: boolean,
};

const initialComputeStatus: ComputeStatus = {
  running: false,
  downloaded: false,
  started: false,
  computed: false,
  newParams: new Uint8Array(0),
  uploaded: false,
}


export class Computation extends React.Component {
  wasm: any | null;
  data: Uint8Array;
  params: Uint8Array;
  entropy: Uint8Array;
  hash: string;
  computeStatus: ComputeStatus;

  constructor(props: {
      ceremonyId: string, 
      dataIndex: number,
      queueIndex: number,
      addMessage: (s: string) => void,
    }) {
    super(props);
    this.wasm = null;
    this.data = null;
    this.params = new Uint8Array(0);
    this.entropy = new Uint8Array(0);
    this.hash = '';
    this.computeStatus = initialComputeStatus;
  }  

  doComputation (): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) =>
      {
        try {
          const newParams = this.wasm.contribute(this.params, this.entropy, this.reportProgress, this.setHash);
          console.log('Updated params', newParams);
          resolve(newParams);
        } catch (err) {
          reject(err);
        }
    })
  };

  async reportProgress (count: number, totExponents: number) {
    console.log(`progress: ${count} of ${totExponents}`);
    //await  new Promise(resolve => setTimeout(resolve, 100));
  };

  setComputeStatus(partialStatus: any) {
    this.computeStatus = {
      ...this.computeStatus,
      ...partialStatus,
    }
  }
  
  //const [computeStatus, setComputeStatus] = React.useState<ComputeStatus>(initialComputeStatus);
  //const wasm = useRef<any | null>(null);
  //const data = useRef<Uint8Array | null>(null);
  //const entropy = useRef(new Uint8Array(0));
  //const contributionState = useRef<ContributionState | null>(null);
  //const hash = useRef<string>('');

  async loadWasm() {
    //try {
      //if (!loading) {
      //  setLoading(true);
        // ignore syntax check error. Make sure to *npm link* phase2 in ../lib/pkg
        this.wasm = await import('phase2');
        console.log('wasm set');
      //}
    //} finally {
      //setLoading(false);
    //}
  };

  getEntropy() {
    this.entropy = new Uint8Array(64).map(() => Math.random() * 256);
    console.log(`entropy set`);
  };

  startCompute() {
    this.setComputeStatus({running: true});
  };

  async compute() {
    const { running, downloaded, started, computed, uploaded, newParams } = this.computeStatus;
    console.log(`compute step: ${running? 'running' : '-'} ${running && downloaded && !computed ? 'computing': running && computed && !uploaded ? 'uploaded' : 'inactive'}`);
    const ceremonyId = this.props.ceremonyId;

    if (running && ceremonyId) {
      if (!downloaded) {
        GetParamsFile(ceremonyId, this.props.dataIndex).then( (paramData) => {
          addCeremonyEvent(ceremonyId, createCeremonyEvent(
             "PARAMS_DOWNLOADED",
             `Parameters from participant ${this.props.dataIndex} downloaded OK`,
             this.props.queueIndex
          ));
          console.log('Source params', paramData);
          this.data = paramData;
          this.props.addMessage(`Parameters downloaded.`);
          this.setComputeStatus({downloaded: true});
        })
      }
      if (downloaded && !computed) {
        if (!started) {
          console.log('running computation......');
          if (this.data) {
            doComputation(wasm.current, data.current, Buffer.from(entropy.current), setHash).then(async (newParams) => {
              console.log('DoComputation finished');
              await addCeremonyEvent(ceremonyId, createCeremonyEvent(
                "COMPUTE_CONTRIBUTION", 
                `Contribution for participant ${contributionState.current?.queueIndex} completed OK`,
                contributionState.current?.queueIndex
              ));
              addMessage(`Computation completed.`);
              entropy.current = new Uint8Array(); // Reset now that it has been used
              setComputeStatus({...computeStatus, computed: true, newParams});
          })};
          setComputeStatus({...computeStatus, started: true});
        }
      }
      if (computed && !uploaded) {
        try {
          const newIndex = contributionState.current?.queueIndex;
          const paramsFile = await UploadParams(ceremonyId, newIndex, newParams);
          // Add event to notify status and params file name
          await addCeremonyEvent(ceremonyId, createCeremonyEvent(
            "PARAMS_UPLOADED", 
            `Parameters for participant ${newIndex} uploaded to ${paramsFile}`,
            contributionState.current?.queueIndex
          ));
          addMessage(`Parameters uploaded.`);
          const duration = ((Date.now()) - contributionState.current?.startTime) / 1000;
          const contribution = createContributionSummary(
             participant.current ? participant.current.uid : '??',
             "COMPLETE", 
             paramsFile, 
             newIndex, 
             hash.current,
             duration
            );
          await addOrUpdateContribution(ceremonyId, contribution);
          addMessage(`Thank you for your contribution.`)
        } finally {
          setComputeStatus({...computeStatus, running: false, uploaded: true, newParams: new Uint8Array()});
          //setCeremonyId(null);
          contributionState.current = null;
          hash.current = '';
          setStep(Step.WAITING);
        }
      }
    }
  }; 

  setHash(resultHash: string) {
    try {
      console.log(`setHash: ${resultHash}`);
      this.props.addMessage(`Hash: ${resultHash}`);
      this.hash = resultHash;
    } catch (err) { console.log(err.message); }
  }

  step() {
      // Waiting for a ceremony
      if (!computeStatus.running && contributionState.current) {
        console.log(`contribution state: ${JSON.stringify(contributionState.current)}`);
        if (contributionState.current.queueIndex == contributionState.current.currentIndex) {
          console.log('ready to go');
          setComputeStatus({...initialComputeStatus, running: true });
        }
      }
    
      break;
    }
    case (Step.QUEUED): {
      // Waiting for a ceremony
      if (!computeStatus.running && contributionState.current) {
        console.log(`contribution state: ${JSON.stringify(contributionState.current)}`);
        if (contributionState.current.queueIndex === contributionState.current.currentIndex) {
          console.log('ready to go');
          setComputeStatus({...initialComputeStatus, running: true });
        }
        content = queueProgressCard(contributionState.current);
      }
    
      break;
    }
    case (Step.RUNNING): {
      // We have a ceremony to contribute to. Download parameters

      // Compute

      // Upload
      compute();

      content = (<><CircularProgress disableShrink />{
           !computeStatus.downloaded ? stepText('Downloading ...') 
         : !computeStatus.computed ? stepText('Calculating ...')
         : stepText('Uploading ...') 
      }</>);
      break;
    }
  };

  //const run = () => {
  //  setComputeStatus({...initialComputeStatus, running: true });
  //};

  // const serviceWorker = () => { 
  //   navigator.serviceWorker.ready.then(() => {
  //     console.log('service worker ready');
  //     navigator.serviceWorker.controller?.postMessage({type: 'LOAD_WASM'});
  //     navigator.serviceWorker.addEventListener('message', event => {
  //       console.log(`message from service worker ${event.data.type}`);
  //     });
  //   });
  // };

  //serviceWorker();

  render() {
    return (<div></div>);
  }
}