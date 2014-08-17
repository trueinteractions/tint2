if(process.argv[2] == 'baseline') { setup(); baseline(); shutdown(); }
else if(process.argv[2] == 'tests') { setup(); run(); shutdown(); }
