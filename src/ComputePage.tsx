import React, { useEffect, useState } from 'react';
import GenerateUserKey from './nillion/components/GenerateUserKey';
import CreateClient from './nillion/components/CreateClient';
import * as nillion from '@nillion/client-web';

import { NillionClient, NadaValues } from '@nillion/client-web';
import StoreSecretForm from './nillion/components/StoreSecretForm';
import StoreProgram from './nillion/components/StoreProgramForm';
import ComputeForm from './nillion/components/ComputeForm';
import ConnectionInfo from './nillion/components/ConnectionInfo';

export default function Main() {
  const programName = 'voting';
  const outputName = 'narendra_modi_votes';
  const partyName = 'Official';
  const [userkey, setUserKey] = useState<string | null>(null);
  const [client, setClient] = useState<NillionClient | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [additionalComputeValues, setAdditionalComputeValues] = useState<NadaValues | null>(null);
  const [voteStartCount, setVoteStartCount] = useState<string | null>(null);
  const [votes, setVotes] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<{ [key: string]: number | null }>({
    narendra_modi_votes: null,
    rahul_gandhi_votes: null,
    mamta_bannerjee_votes: null,
  });
  const [computeResult, setComputeResult] = useState<string | null>(null);
  const [winner,setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (Object.values(results).every(v => v !== null)) {
      const maxVotes = Math.max(...Object.values(results));
      const winner = Object.keys(results).find(key => results[key] === maxVotes);
      setWinner(winner);
    }
  }, [results]);

  useEffect(() => {
    if (userkey && client) {
      setUserId(client.user_id);
      setPartyId(client.party_id);
      const additionalComputeValues = new nillion.NadaValues();
      setAdditionalComputeValues(additionalComputeValues);
    }
  }, [userkey, client]);

  return (
    <div>
      <h1>Blind Voting Demo</h1>
      <p>
        Connect to Nillion with a user key, then follow the steps to store the
        voting program, store votes, and compute the results.
      </p>
      <ConnectionInfo client={client} userkey={userkey} />

      <h1>1. Connect to Nillion Client {client && ' ✅'}</h1>
      <GenerateUserKey setUserKey={setUserKey} />

      {userkey && <CreateClient userKey={userkey} setClient={setClient} />}
      <br />
      <h1>2. Store Program {programId && ' ✅'}</h1>
      {client && (
        <>
          <StoreProgram
            nillionClient={client}
            defaultProgram={programName}
            onNewStoredProgram={(program) => setProgramId(program.program_id)}
          />
        </>
      )}
      <br />
      <h1>3. Store Secrets {voteStartCount && Object.keys(votes).length === 8 && ' ✅'}</h1>
      {userId && programId && (
        <>
          <h2>Store Vote Start Count {voteStartCount && ' ✅'}</h2>
          <StoreSecretForm
            secretName="vote_start_count"
            onNewStoredSecret={(secret) => setVoteStartCount(secret.storeId)}
            nillionClient={client}
            secretType="SecretInteger"
            isLoading={false}
            startCount={0}
            itemName=""
            hidePermissions
            defaultUserWithComputePermissions={userId}
            defaultProgramIdForComputePermissions={programId}
          />
          
          {Array.from({length: 8}, (_, i) => (
            <div key={i}>
              <h2>Store Vote for Voter {i} {votes[`vote_${i}`] && ' ✅'}</h2>
              <StoreSecretForm
                secretName={`vote_${i}`}
                onNewStoredSecret={(secret) => setVotes(prev => ({...prev, [`vote_${i}`]: secret.storeId}))}
                nillionClient={client}
                secretType="SecretInteger"
                isLoading={false}
                itemName=""
                isVoter={true}
                hidePermissions
                defaultUserWithComputePermissions={userId}
                defaultProgramIdForComputePermissions={programId}
              />
            </div>
          ))}
        </>
      )}
      <h1>4. Compute {Object.values(results).every(v => v !== null) && ' ✅'}</h1>
      {client &&
        programId &&
        voteStartCount &&
        Object.keys(votes).length === 8 &&
        partyId &&
        additionalComputeValues && (
        <ComputeForm
          nillionClient={client}
          programId={programId}
          additionalComputeValues={additionalComputeValues}
          storeIds={[voteStartCount, ...Object.values(votes)]}
          inputParties={[
            { partyName: "Official", partyId },
            ...Array.from({length: 8}, (_, i) => ({ partyName: `Voter${i}`, partyId }))
          ]}
          outputParties={[{ partyName: partyName, partyId }]}
          outputName={outputName}
          onComputeProgram={(result) => setComputeResult(result.value)}
        />
      )}

      {Object.values(results).every(v => v !== null) && (
        <div>
          <h2>Voting Results: {computeResult}</h2>
          <ul>
            {Object.entries(results).map(([candidate, votes]) => (
              <li key={candidate}>{candidate}: {votes} votes</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}