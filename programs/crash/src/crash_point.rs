use hex;
use hmac::{Hmac, Mac};
use sha2::Sha256;

pub fn crash_point(seed: String, randomness: [u8; 32]) -> f64 {
    let byte_seed = seed.as_bytes();
    // Create alias for HMAC-SHA256
    type HmacSha256 = Hmac<Sha256>;

    // Sha256
    let mut mac = HmacSha256::new_from_slice(byte_seed).expect("HMAC can take key of any size");
    mac.update(&randomness);

    // `result` has type `CtOutput` which is a thin wrapper around array of
    // bytes for providing constant time equality check
    let result = mac.finalize();
    // Underlying array
    let code_bytes = result.into_bytes();
    // Hex encoding
    let hex_data = hex::encode(code_bytes);
    // Get result
    return crash_result(&hex_data);
}

fn crash_result(data: &String) -> f64 {
    let hs: i64 = 100 / 5;
    if divisible(&data, &hs) {
        return 1.0;
    }
    let h = match i64::from_str_radix(&data[0..52 / 4], 16) {
        Ok(num) => num,
        Err(_error) => 1,
    };
    let base: i64 = 2; // an explicit type is required
    let e = base.pow(52);

    let mut result: f64 = ((100 * e - h) / (e - h)) as f64;
    result = result.floor();
    return result / 100.0;
}

fn divisible(hash: &String, hs: &i64) -> bool {
    let mut val: i64 = 0;
    let o = hash.len() % 4;

    let mut i = if o > 0 { o - 4 } else { 0 };

    while i < hash.len() {
        let z = match i64::from_str_radix(&hash[i..i + 4], 16) {
            Ok(num) => num,
            Err(_error) => 1,
        };
        val = ((val << 16) + z) % hs;
        i += 4;
    }
    return val == 0;
}
