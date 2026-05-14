"""MIRA cognitive core — pure-math subsystems.

Contains the Bayesian Cognitive State Tracker, Thompson Sampling bandit,
depth classifier, frustration detector, and concept matcher.

These modules have NO LLM dependency — they're deterministic math.
Tested in isolation with pytest. The LLM calls happen at higher layers
that CONSUME these subsystems.
"""
