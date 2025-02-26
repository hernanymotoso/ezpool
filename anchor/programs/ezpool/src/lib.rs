#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod ezpool {
    use super::*;

  pub fn close(_ctx: Context<CloseEzpool>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.ezpool.count = ctx.accounts.ezpool.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.ezpool.count = ctx.accounts.ezpool.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeEzpool>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.ezpool.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeEzpool<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Ezpool::INIT_SPACE,
  payer = payer
  )]
  pub ezpool: Account<'info, Ezpool>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseEzpool<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub ezpool: Account<'info, Ezpool>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub ezpool: Account<'info, Ezpool>,
}

#[account]
#[derive(InitSpace)]
pub struct Ezpool {
  count: u8,
}
