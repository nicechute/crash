import React, { Component, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl, SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from '@solana/web3.js';
import { Program, Provider, web3, BN } from '@project-serum/anchor';
import idl from './idl.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [getPhantomWallet()]

const { SystemProgram, LAMPORTS_PER_SOL } = web3;
const opts = {
    preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function App() {
    const [input] = useState('');
    const wallet = useWallet()

    async function getProvider() {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        // const network = "http://127.0.0.1:8899";
        const network = clusterApiUrl('devnet');
        const connection = new Connection(network, opts.preflightCommitment);

        const provider = new Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    async function crash() {
        const provider = await getProvider();
        const program = new Program(idl, programID, provider);

        const play_amount = new BN(0.1 * LAMPORTS_PER_SOL);
        const play_multi = new BN(300); //3x
        let server_seed = "97d2a569059bbcd8ead4444ff99071f4c01d005bcefe0d3567e1be628e5fdcd9"; //5.04

        console.log("BALANCE:", await provider.connection.getBalance(wallet.publicKey));

        let [pda, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId);
        console.log(`bump: ${bump}, pubkey: ${pda.toBase58()}`);
        // console.log("Wallet:", wallet.publicKey)
        // console.log("Play amount:", play_amount)
        // console.log("Multiplier:", play_multi)
        // console.log("Server seed:", server_seed)

        await program.rpc.play(
            play_amount,
            play_multi,
            server_seed, {
            accounts: {
                fromAccountInfo: wallet.publicKey,
                pdaAccountInfo: pda,
                systemProgramAccountInfo: SystemProgram.programId,
                recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
            }
        });
        console.log("PLAY GAME");
        console.log("BALANCE:", await provider.connection.getBalance(wallet.publicKey));
    }

    if (!wallet.connected) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
                <WalletMultiButton />
            </div>
        )
    } else {
        return (
            <div className="App">
                <div>
                    <button onClick={crash}>Play</button>
                </div>
            </div >
        );
    }
}

const AppWithProvider = () => (
    <ConnectionProvider endpoint="http://127.0.0.1:8899">
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <App />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default AppWithProvider;