use rand::{Rng, rng};

const ALPHANUM: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TOKEN_LEN: usize = 5;

pub trait SubscriptionTokenGenerator {
    fn generate(&self) -> String;
}

#[derive(Default)]
pub struct RandomTokenGenerator;

impl SubscriptionTokenGenerator for RandomTokenGenerator {
    fn generate(&self) -> String {
        let mut rng = rng();

        (0..TOKEN_LEN)
            .map(|_| {
                let idx = rng.random_range(0..ALPHANUM.len());
                ALPHANUM[idx] as char
            })
            .collect()
    }
}
