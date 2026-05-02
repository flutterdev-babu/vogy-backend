import bcrypt from 'bcryptjs';

async function test() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match:', isMatch);
  
  const isMatchWrong = await bcrypt.compare('wrong', hash);
  console.log('Match Wrong:', isMatchWrong);
}

test();
