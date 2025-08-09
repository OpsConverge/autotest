#!/usr/bin/env bash
#   Use this script to test if a TCP host/port is available

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port..."
  sleep 3
done

>&2 echo "$host:$port is available - executing command"
exec $cmd
