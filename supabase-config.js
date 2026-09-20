const supabaseUrl = 'https://xoymhtinwvxlashrejtl.supabase.co';
const supabaseAnonKey = 'sb_publishable_cfXCcXDrBAZg8TPNWsg5lg_1HW2lrB8';

const supabaseClient = window.supabase?.createClient
	? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
	: null;
