#!/bin/bash
sudo apt update && sudo apt upgrade
sudo apt-get install -y tor
sudo systemctl status tor.service
sudo systemctl status tor@default.service
sudo cp /etc/tor/torrc /etc/tor/torrc.backup
#write config
echo "SocksPort 0.0.0.0:9050" | sudo tee -a /etc/tor/torrc
echo "SocksPolicy accept *" | sudo tee -a /etc/tor/torrc
echo "RunAsDaemon 1" | sudo tee -a /etc/tor/torrc
echo "DataDirectory /var/lib/tor" | sudo tee -a /etc/tor/torrc

sudo systemctl restart tor@default.service