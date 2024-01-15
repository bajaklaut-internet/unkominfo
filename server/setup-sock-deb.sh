#!/bin/bash
sudo apt update
sudo apt install -y dante-server
sudo systemctl status danted.service
sudo mv /etc/danted.conf /etc/danted.conf.backup