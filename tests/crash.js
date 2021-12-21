const assert = require('assert');
const anchor = require('@project-serum/anchor');
const Web3 = require('@solana/web3.js')
const { SystemProgram, PublicKey, Transaction, Keypair, LAMPORTS_PER_SOL, SYSVAR_RECENT_BLOCKHASHES_PUBKEY } = anchor.web3

describe('crash', () => {
  const provider = anchor.Provider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Crash;

  it('Can be played', async () => {

    const play_amount = new anchor.BN(LAMPORTS_PER_SOL);
    const play_multi = new anchor.BN(300); //3.00x
    let server_seed = "97d2a569059bbcd8ead4444ff99071f4c01d005bcefe0d3567e1be628e5fdcd9"; //5.04

    // from payer
    const from = Keypair.generate();
    const feePayerAirdropSignature = await provider.connection.requestAirdrop(from.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(feePayerAirdropSignature);

    // setup pda
    let [pda, bump] = await PublicKey.findProgramAddress([Buffer.from("escrow")], program.programId);
    console.log(`bump: ${bump}, pubkey: ${pda.toBase58()}`);

    const pdaAirdropSignature = await provider.connection.requestAirdrop(pda, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(pdaAirdropSignature);

    const tx = await program.rpc.play(
      play_amount,
      play_multi,
      server_seed, {
      accounts: {
        fromAccountInfo: from.publicKey,
        pdaAccountInfo: pda,
        systemProgramAccountInfo: anchor.web3.SystemProgram.programId,
        recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
      },
      signers: [from],
    });
    const from_info = await provider.connection.getAccountInfo(from.publicKey)
    console.log(from_info)
  })

});
