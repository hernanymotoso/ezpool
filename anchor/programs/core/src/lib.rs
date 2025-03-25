// FIXME: disable std for non-test builds to decrease wasm binary size.
// There is currently something in tsify that prevents this:
// https://github.com/madonoharu/tsify/issues/56
// #![cfg_attr(not(test), no_std)]
#![allow(clippy::useless_conversion)]

mod constants;
mod math;
mod quote;
mod types;

pub use constants::*;
pub use math::*;
pub use quote::*;
pub use types::*;

// Adding specific WASM exports
#[cfg(feature = "wasm")]
pub mod wasm {
    use wasm_bindgen::prelude::*;
    use crate::types::U128;
    use crate::TransferFee;
    use crate::CoreError;
    use crate::IncreaseLiquidityQuote;
    use crate::TickRange;

    #[wasm_bindgen]
    pub fn price_to_sqrt_price(price: f64, decimals_a: u8, decimals_b: u8) -> u128 {
        let result: U128 = crate::math::price::price_to_sqrt_price(price, decimals_a, decimals_b);
        result.into()
    }

    #[wasm_bindgen]
    pub fn sqrt_price_to_price(sqrt_price: u128, decimals_a: u8, decimals_b: u8) -> f64 {
        crate::math::price::sqrt_price_to_price(sqrt_price.into(), decimals_a, decimals_b)
    }

    #[wasm_bindgen]
    pub fn price_to_tick_index(price: f64, decimals_a: u8, decimals_b: u8) -> i32 {
        crate::math::price::price_to_tick_index(price, decimals_a, decimals_b)
    }

    #[wasm_bindgen]
    pub fn order_tick_indexes(tick_index_1: i32, tick_index_2: i32) -> TickRange {
        crate::math::tick::order_tick_indexes(tick_index_1, tick_index_2)
    }

    #[wasm_bindgen]
    pub fn get_initializable_tick_index(tick_index: i32, tick_spacing: u16, round_up: Option<bool>) -> i32 {
        crate::math::tick::get_initializable_tick_index(tick_index, tick_spacing, round_up)
    }

    #[wasm_bindgen]
    pub fn increase_liquidity_quote(
        liquidity_delta: u128,
        slippage_tolerance_bps: u16,
        current_sqrt_price: u128,
        tick_index_1: i32,
        tick_index_2: i32,
        transfer_fee_a: Option<TransferFee>,
        transfer_fee_b: Option<TransferFee>,
    ) -> Result<IncreaseLiquidityQuote, CoreError> {
        crate::quote::liquidity::increase_liquidity_quote(
            liquidity_delta.into(),
            slippage_tolerance_bps,
            current_sqrt_price.into(),
            tick_index_1,
            tick_index_2,
            transfer_fee_a,
            transfer_fee_b,
        )
    }

    #[wasm_bindgen]
    pub fn increase_liquidity_quote_a(
        token_amount_a: u64,
        slippage_tolerance_bps: u16,
        current_sqrt_price: u128,
        tick_index_1: i32,
        tick_index_2: i32,
        transfer_fee_a: Option<TransferFee>,
        transfer_fee_b: Option<TransferFee>,
    ) -> Result<IncreaseLiquidityQuote, CoreError> {
        crate::quote::liquidity::increase_liquidity_quote_a(
            token_amount_a,
            slippage_tolerance_bps,
            current_sqrt_price.into(),
            tick_index_1,
            tick_index_2,
            transfer_fee_a,
            transfer_fee_b,
        )
    }

    #[wasm_bindgen]
    pub fn increase_liquidity_quote_b(
        token_amount_b: u64,
        slippage_tolerance_bps: u16,
        current_sqrt_price: u128,
        tick_index_1: i32,
        tick_index_2: i32,
        transfer_fee_a: Option<TransferFee>,
        transfer_fee_b: Option<TransferFee>,
    ) -> Result<IncreaseLiquidityQuote, CoreError> {
        crate::quote::liquidity::increase_liquidity_quote_b(
            token_amount_b,
            slippage_tolerance_bps,
            current_sqrt_price.into(),
            tick_index_1,
            tick_index_2,
            transfer_fee_a,
            transfer_fee_b,
        )
    }

    #[wasm_bindgen]
    pub fn get_tick_array_start_tick_index(
        tick_index: i32,
        tick_spacing: u16,
    ) -> i32 {
        crate::math::tick::get_tick_array_start_tick_index(
            tick_index,
            tick_spacing,
        )
    }
}
