// Quick test script - run in browser console
console.log('🔍 Running quick tests...');

// Test 1: Check Supabase connection
console.log('Test 1: Supabase Connection');
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
console.log(sessionError ? '❌ Error: ' + sessionError.message : '✅ Session: ' + (sessionData.session ? 'Active' : 'None'));

// Test 2: Check workers
console.log('Test 2: Workers Table');
const { data: workers, error: workersError } = await supabase.from('workers').select('*');
console.log(workersError ? '❌ Error: ' + workersError.message : '✅ Workers: ' + workers.length);

// Test 3: Check attendance
console.log('Test 3: Attendance Table');
const today = new Date().toISOString().split('T')[0];
const { data: attendance, error: attError } = await supabase.from('attendance').select('*').eq('work_date', today);
console.log(attError ? '❌ Error: ' + attError.message : '✅ Today attendance: ' + attendance.length);

// Test 4: Check RPC function
console.log('Test 4: RPC Function');
if (workers && workers.length > 0) {
    const worker = workers[0];
    const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_attendance_with_payment', {
        p_worker_id: worker.id,
        p_work_date: today,
        p_status: 'present',
        p_wage_amount: worker.daily_rate,
        p_payment_amount: 0
    });
    console.log(rpcError ? '❌ RPC Error: ' + rpcError.message : '✅ RPC Result: ' + JSON.stringify(rpcResult));
}

// Test 5: Check if attendance was saved
console.log('Test 5: Verify Attendance Saved');
const { data: savedAtt, error: savedError } = await supabase.from('attendance').select('*').eq('work_date', today);
console.log(savedError ? '❌ Error: ' + savedError.message : '✅ Attendance records: ' + savedAtt.length);

// Test 6: Check transactions
console.log('Test 6: Transactions');
const { data: transactions, error: txnError } = await supabase.from('worker_transactions').select('*');
console.log(txnError ? '❌ Error: ' + txnError.message : '✅ Transactions: ' + transactions.length);

// Test 7: Check financial calculations
console.log('Test 7: Financial Calculations');
if (workers && workers.length > 0) {
    for (const worker of workers) {
        const workerAtt = attendance.filter(a => a.worker_id === worker.id);
        const totalWages = workerAtt.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
        const totalAdvance = transactions?.filter(t => t.worker_id === worker.id && t.transaction_type === 'advance').reduce((sum, t) => sum + t.amount, 0) || 0;
        const totalPaid = transactions?.filter(t => t.worker_id === worker.id && t.transaction_type === 'payment').reduce((sum, t) => sum + t.amount, 0) || 0;
        const netBalance = totalWages - totalAdvance - totalPaid;
        
        console.log(`${worker.name}: Wages ₹${totalWages}, Advance ₹${totalAdvance}, Paid ₹${totalPaid}, Balance ₹${netBalance}`);
    }
}

console.log('✅ Tests complete!');
