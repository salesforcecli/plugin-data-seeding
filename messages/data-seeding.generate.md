# summary

Generate org data using AI

# description

Generates data using AI that is similar to selected data from a source org, based on a configuration file, and loads it into a target org

# examples

- Generate data using org aliases
   
  $ <%= config.bin %> <%= command.id %> -s mySourceOrg -o myTargetOrg -f "./config/seed-config.json"

- Generate data using usernames for each org

  $ <%= config.bin %> <%= command.id %> --source-org="source@org.com" --target-org="target@org.com" --config-file "./config/seed-config.json"

# flags.target-org.summary

Username or alias of the Target org where generated data will be loaded to.

# flags.source-org.summary

Username or alias of the Source org containing data to be used as input for AI to generate similar data.

# flags.config-file.summary

Path to data seeding JSON configuration file.

# flags.wait.summary

Number of minutes to wait for command to complete.

# flags.async.summary

Run the command asynchronously.

# report.suggestion

 - Check the status with: sf data-seeding generate report -i %s
