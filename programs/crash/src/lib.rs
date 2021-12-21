use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program::invoke, program::invoke_signed,
    pubkey::Pubkey, system_instruction,
};

mod crash_point;
mod recent_blockhash;

declare_id!("HtZqFAA1nyZ38Yfv5pDDDTi2RwGVLc86GuNbahSpdhWU");

#[program]
pub mod crash {

    use super::*;
    const ESCROW_PDA_SEED: &[u8] = b"escrow";

    pub fn play(
        ctx: Context<Game>,
        amount: u64,
        multiplier: u64,
        server_seed: String,
    ) -> ProgramResult {
        let (_vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[ESCROW_PDA_SEED], ctx.program_id);

        let pda_account_info = &ctx.accounts.pda_account_info;
        let from_account_info = &ctx.accounts.from_account_info;
        let system_program_account_info = &ctx.accounts.system_program_account_info;

        let decimal_multiplier = multiplier as f64 / 100.0;

        invoke(
            &system_instruction::transfer(&from_account_info.key, &pda_account_info.key, amount),
            &[
                from_account_info.clone(),
                pda_account_info.clone(),
                system_program_account_info.clone(),
            ],
        )?;

        let randomness =
            recent_blockhash::last_blockhash_accessor(&ctx.accounts.recent_blockhashes)?;

        let crash_point: f64 = crash_point::crash_point(server_seed, randomness);
        msg!("{}", crash_point);

        if crash_point >= decimal_multiplier {
            let (_vault_authority, vault_authority_bump) =
                Pubkey::find_program_address(&[ESCROW_PDA_SEED], ctx.program_id);
            let authority_seeds = &[&ESCROW_PDA_SEED[..], &[vault_authority_bump]];

            let pda_account_info = &ctx.accounts.pda_account_info;
            let to_account_info = &ctx.accounts.from_account_info;
            let system_program_account_info = &ctx.accounts.system_program_account_info;

            let mut payout_amount = decimal_multiplier * amount as f64;
            payout_amount = payout_amount + amount as f64;

            invoke_signed(
                &system_instruction::transfer(
                    &pda_account_info.key,
                    &to_account_info.key,
                    payout_amount as u64,
                ),
                &[
                    pda_account_info.clone(),
                    to_account_info.clone(),
                    system_program_account_info.clone(),
                ],
                &[authority_seeds],
            )?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Game<'info> {
    #[account(signer, mut)]
    pub from_account_info: AccountInfo<'info>,
    #[account(mut)]
    pub pda_account_info: AccountInfo<'info>,
    pub system_program_account_info: AccountInfo<'info>,
    #[account(address = sysvar::recent_blockhashes::ID)]
    pub recent_blockhashes: UncheckedAccount<'info>,
}
