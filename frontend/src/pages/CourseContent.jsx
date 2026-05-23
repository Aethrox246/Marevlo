import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, AlertTriangle,
  LayoutGrid, X, Clock,
} from "lucide-react";

const COURSE_HTML_MAP = {
  "prompt-engineering-0": "/courses/Prompt_Engineering_Moduless.html",
  "video-processing-0": "/courses/videoingestion.html",
  "vectorless-rag": "/courses/videoingestion.html",
  "rag-module-0": "/cources/generative-ai/RAG/rag_module_0.html",
  "rag-module-1": "/cources/generative-ai/RAG/rag_module_1.html",
  "rag-module-2": "/cources/generative-ai/RAG/rag_module_2.html",
  "rag-module-3": "/cources/generative-ai/RAG/rag_module_3.html",
  "rag-module-4": "/cources/generative-ai/RAG/rag_module_4.html",
  "rag-module-5": "/cources/generative-ai/RAG/rag_module_5.html",
  "rag-module-6a": "/cources/generative-ai/RAG/rag_module_6a.html",
  "rag-module-6b": "/cources/generative-ai/RAG/rag_module_6b.html",
  "rag-module-6c": "/cources/generative-ai/RAG/rag_module_6c.html",
  "rag-module-7": "/cources/generative-ai/RAG/rag_module_7.html",
  "rag-module-8": "/cources/generative-ai/RAG/rag_module_8.html",
  "rag-module-9": "/cources/generative-ai/RAG/rag_module_9.html",
  "rag-module-10": "/cources/generative-ai/RAG/rag_module_10.html",
  "rag-module-11": "/cources/generative-ai/RAG/rag_module_11.html",
  "rag-module-12": "/cources/generative-ai/RAG/rag_module_12.html",
  "rag-module-13": "/cources/generative-ai/RAG/rag_module_13.html",
  "rag-module-14": "/cources/generative-ai/RAG/rag_module_14.html",
  "rag-ingestion": "/cources/generative-ai/RAG/rag_ingestion.html",
  "rag-ingestion-ocr": "/cources/generative-ai/RAG/rag_ingestion_ocr.html",
  "rag-ingestion-ocr-layout": "/cources/generative-ai/RAG/rag_ingestion_ocr_layout.html",
  "dla-module-0": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m0.html",
  "dla-module-1": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m1.html",
  "dla-module-2": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m2.html",
  "dla-module-3": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m3.html",
  "dla-module-4": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m4.html",
  "dla-module-5": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m5.html",
  "dla-module-6": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m6.html",
  "dla-module-7": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m7.html",
  "dla-module-8": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m8.html",
  "dla-module-9": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m9.html",
  "dla-module-10": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m10.html",
  "dla-module-11": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m11.html",
  "dla-module-12": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m12.html",
  "dla-module-13": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m13.html",
  "dla-module-14": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m14.html",
  "dla-module-15": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m15.html",
  "dla-module-16": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m16.html",
  "dla-module-17": "/cources/generative-ai/RAG/Ingestion/OCR/document layout analysis/dla_m17.html",
  "ocr-text-module-0": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m0.html",
  "ocr-text-module-1": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m1.html",
  "ocr-text-module-2": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m2.html",
  "ocr-text-module-3": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m3.html",
  "ocr-text-module-4": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m4.html",
  "ocr-text-module-5": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m5.html",
  "ocr-text-module-6": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m6.html",
  "ocr-text-module-7": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m7.html",
  "ocr-text-module-8": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m8.html",
  "ocr-text-module-9": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m9.html",
  "ocr-text-module-10": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m10.html",
  "ocr-text-module-11": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m11.html",
  "ocr-text-module-12": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m12.html",
  "ocr-text-module-13": "/cources/generative-ai/RAG/Ingestion/OCR/text/ocr_m13.html",
  "rag-ingestion-ocr-text": "/cources/generative-ai/RAG/rag_ingestion_ocr_text.html",
  "rag-ingestion-dit": "/cources/generative-ai/RAG/rag_ingestion_dit.html",
  "rag-ingestion-msp": "/cources/generative-ai/RAG/rag_ingestion_msp.html",
  "dit-module-0": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m0.html",
  "dit-module-1": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m1.html",
  "dit-module-2": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m2.html",
  "dit-module-3": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m3.html",
  "dit-module-4": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m4.html",
  "dit-module-5": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m5.html",
  "dit-module-6": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m6.html",
  "dit-module-7": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m7.html",
  "dit-module-8": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m8.html",
  "dit-module-9": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m9.html",
  "dit-module-10": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m10.html",
  "dit-module-11": "/cources/generative-ai/RAG/Ingestion/DIT/dit_m11.html",
  "docformer-module-1": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_1.html",
  "docformer-module-2": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_2.html",
  "docformer-module-3": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_3.html",
  "docformer-module-4": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_4.html",
  "docformer-module-5": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_5.html",
  "docformer-module-6": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_6.html",
  "docformer-module-7": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_7.html",
  "docformer-module-8": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_8.html",
  "docformer-module-9": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_9.html",
  "docformer-module-10": "/cources/generative-ai/RAG/Ingestion/Docformer/docformer_module_10.html",
  "infonce-module-0": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_0.html",
  "infonce-module-1": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_1.html",
  "infonce-module-2": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_2.html",
  "infonce-module-3": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_3.html",
  "infonce-module-4": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_4.html",
  "infonce-module-5": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_5.html",
  "infonce-module-6": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_6.html",
  "infonce-module-7": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_7.html",
  "infonce-module-8": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_8.html",
  "infonce-module-9": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_9.html",
  "infonce-module-10": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_10.html",
  "infonce-module-11": "/cources/generative-ai/RAG/Ingestion/Infonce/infonce_module_11.html",
  "mfp-module-0": "/cources/generative-ai/RAG/Ingestion/MFP/mfp_m0.html",
  "mfp-module-1": "/cources/generative-ai/RAG/Ingestion/MFP/mfp_m1.html",
  "mfp-module-2": "/cources/generative-ai/RAG/Ingestion/MFP/mfp_m2.html",
  "mfp-module-3": "/cources/generative-ai/RAG/Ingestion/MFP/mfp_m3.html",
  "mfp-module-4": "/cources/generative-ai/RAG/Ingestion/MFP/mfp_m4.html",
  "vmi-module-0": "/cources/generative-ai/RAG/Ingestion/VMI/vmi_m0.html",
  "vmi-module-1": "/cources/generative-ai/RAG/Ingestion/VMI/vmi_m1.html",
  "vmi-module-2": "/cources/generative-ai/RAG/Ingestion/VMI/vmi_m2.html",
  "vmi-module-3": "/cources/generative-ai/RAG/Ingestion/VMI/vmi_m3.html",
  "quant-module-0": "/cources/generative-ai/RAG/quantisation/quant_m0.html",
  "quant-module-1": "/cources/generative-ai/RAG/quantisation/quant_m1.html",
  "quant-module-2": "/cources/generative-ai/RAG/quantisation/quant_m2.html",
  "quant-module-3": "/cources/generative-ai/RAG/quantisation/quant_m3.html",
  "eval-module-0": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m0.html",
  "eval-module-1": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m1.html",
  "eval-module-2": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m2.html",
  "eval-module-3": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m3.html",
  "eval-module-4": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m4.html",
  "eval-module-5": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m5.html",
  "eval-module-6": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m6.html",
  "eval-module-7": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m7.html",
  "eval-module-8": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m8.html",
  "eval-module-9": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m9.html",
  "eval-module-10": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m10.html",
  "eval-module-11": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m11.html",
  "eval-module-12": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m12.html",
  "eval-module-13": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m13.html",
  "eval-module-14": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m14.html",
  "eval-module-15": "/cources/generative-ai/Multi-modal-rag/evaluation/eval_m15.html",
  "eval-genai-reference": "/cources/generative-ai/Multi-modal-rag/evaluation/genai_evaluation_reference.html",
  "mcp": "/cources/generative-ai/mcp/MCP.html",
  "ds-python": "/cources/Data_Science/python.html",
  "module_1_1": "/cources/Data_Science/stats-prob/module_1_1.html",
  "module_1_2": "/cources/Data_Science/stats-prob/module_1_2.html",
  "module_1_3": "/cources/Data_Science/stats-prob/module_1_3.html",
  "module_1_4": "/cources/Data_Science/stats-prob/module_1_4.html",
  "module_1_5": "/cources/Data_Science/stats-prob/module_1_5.html",
  "module_1_6": "/cources/Data_Science/stats-prob/module_1_6.html",
  "module_1_7": "/cources/Data_Science/stats-prob/module_1_7.html",
  "module_2_1": "/cources/Data_Science/stats-prob/module_2_1.html",
  "module_2_2": "/cources/Data_Science/stats-prob/module_2_2.html",
  "module_2_3": "/cources/Data_Science/stats-prob/module_2_3.html",
  "module_2_4": "/cources/Data_Science/stats-prob/module_2_4.html",
  "module_2_5": "/cources/Data_Science/stats-prob/module_2_5.html",
  "module_2_6": "/cources/Data_Science/stats-prob/module_2_6.html",
  "module_2_7": "/cources/Data_Science/stats-prob/module_2_7.html",
  "module_3_1": "/cources/Data_Science/stats-prob/module_3_1.html",
  "module_3_2": "/cources/Data_Science/stats-prob/module_3_2.html",
  "module_3_3": "/cources/Data_Science/stats-prob/module_3_3.html",
  "module_3_4": "/cources/Data_Science/stats-prob/module_3_4.html",
  "module_3_5": "/cources/Data_Science/stats-prob/module_3_5.html",
  "module_3_6": "/cources/Data_Science/stats-prob/module_3_6.html",
  "module_3_7": "/cources/Data_Science/stats-prob/module_3_7.html",
  "module_3_8": "/cources/Data_Science/stats-prob/module_3_8.html",
  "module_4_1": "/cources/Data_Science/stats-prob/module_4_1.html",
  "module_4_2": "/cources/Data_Science/stats-prob/module_4_2.html",
  "module_4_3": "/cources/Data_Science/stats-prob/module_4_3.html",
  "module_4_4": "/cources/Data_Science/stats-prob/module_4_4.html",
  "module_4_5": "/cources/Data_Science/stats-prob/module_4_5.html",
  "module_4_6": "/cources/Data_Science/stats-prob/module_4_6.html",
  "module_4_7": "/cources/Data_Science/stats-prob/module_4_7.html",
  "module_4_8": "/cources/Data_Science/stats-prob/module_4_8.html",
  "module_5_1": "/cources/Data_Science/stats-prob/module_5_1.html",
  "module_5_2": "/cources/Data_Science/stats-prob/module_5_2.html",
  "module_5_3": "/cources/Data_Science/stats-prob/module_5_3.html",
  "module_5_4": "/cources/Data_Science/stats-prob/module_5_4.html",
  "module_5_5": "/cources/Data_Science/stats-prob/module_5_5.html",
  "module_5_6": "/cources/Data_Science/stats-prob/module_5_6.html",
  "module_6_1": "/cources/Data_Science/stats-prob/module_6_1.html",
  "module_6_2": "/cources/Data_Science/stats-prob/module_6_2.html",
  "module_6_3": "/cources/Data_Science/stats-prob/module_6_3.html",
  "module_6_4": "/cources/Data_Science/stats-prob/module_6_4.html",
  "module_6_5": "/cources/Data_Science/stats-prob/module_6_5.html",
  "module_6_6": "/cources/Data_Science/stats-prob/module_6_6.html",
  "ml-module-1": "/cources/Data_Science/machine-learning/module.1.html",
  "ml-module-2": "/cources/Data_Science/machine-learning/module_2.html",
  "ml-module-3": "/cources/Data_Science/machine-learning/Module_3.html",
  "dl-attention-transformers": "/cources/Data_Science/DL/Attention_transformers_with_examples.html",
  "dl-builder-guide": "/cources/Data_Science/DL/builderGuide_with_examples.html",
  "dl-classification": "/cources/Data_Science/DL/Classification_with_examples.html",
  "dl-cnn": "/cources/Data_Science/DL/CNN.html",
  "dl-computational-performance": "/cources/Data_Science/DL/Computational_Performance.html",
  "dl-gan": "/cources/Data_Science/DL/GAN.html",
  "dl-gaussian-processes": "/cources/Data_Science/DL/GaussianProcesses.html",
  "dl-linear-regression": "/cources/Data_Science/DL/Linear_regresssion_DL.html",
  "dl-nlp": "/cources/Data_Science/DL/NLP.html",
  "dl-optimization-technique": "/cources/Data_Science/DL/Optimization_technique.html",
  "dl-perceptron-ff": "/cources/Data_Science/DL/perceptronFF.html",
  "dl-preliminaries": "/cources/Data_Science/DL/Preliminaries.html",
  "dl-rnn": "/cources/Data_Science/DL/RNN_.html",
  "dl-module-0-1-why-deep-learning": "/cources/Data_Science/DL/module_0_1_why_deep_learning.html",
  "dl-module-0-2-tensors": "/cources/Data_Science/DL/module_0_2_tensors.html",
  "dl-module-0-3-calculus-autograd": "/cources/Data_Science/DL/module_0_3_calculus_autograd.html",
  "dl-module-0-4-cinematch-setup": "/cources/Data_Science/DL/module_0_4_cinematch_setup.html",
  "dl-module-1-1-linear-regression": "/cources/Data_Science/DL/module_1_1_linear_regression.html",
  "dl-module-1-2-loss-landscapes": "/cources/Data_Science/DL/module_1_2_loss_landscapes.html",
  "dl-module-1-3-classification": "/cources/Data_Science/DL/module_1_3_classification.html",
  "dl-module-1-4-perceptron": "/cources/Data_Science/DL/module_1_4_perceptron.html",
  "dl-module-2-1-mlp": "/cources/Data_Science/DL/module_2_1_mlp.html",
  "dl-module-2-2-backprop": "/cources/Data_Science/DL/module_2_2_backprop.html",
  "dl-module-2-3-pytorch-builder": "/cources/Data_Science/DL/module_2_3_pytorch_builder.html",
  "dl-module-2-4-optimization-practice": "/cources/Data_Science/DL/module_2_4_optimization_practice.html",
  "dl-module-2-5-optimization-theory": "/cources/Data_Science/DL/module_2_5_optimization_theory.html",
  "dl-module-2-6-regularization": "/cources/Data_Science/DL/module_2_6_regularization.html",
  "dl-module-2-7-computational-performance": "/cources/Data_Science/DL/module_2_7_computational_performance.html",
  "dl-module-3-1-cnns": "/cources/Data_Science/DL/module_3_1_cnns.html",
  "dl-module-3-2-cnn-architectures": "/cources/Data_Science/DL/module_3_2_cnn_architectures.html",
  "dl-module-3-3-rnns": "/cources/Data_Science/DL/module_3_3_rnns.html",
  "dl-module-3-4-lstm-gru": "/cources/Data_Science/DL/module_3_4_lstm_gru.html",
  "dl-module-3-5-capstone": "/cources/Data_Science/DL/module_3_5_capstone.html",
  "dl-module-4-1-attention": "/cources/Data_Science/DL/module_4_1_attention.html",
  "dl-module-4-2-transformer": "/cources/Data_Science/DL/module_4_2_transformer.html",
  "dl-module-4-3-word2vec": "/cources/Data_Science/DL/module_4_3_word2vec.html",
  "dl-module-4-4-pretraining": "/cources/Data_Science/DL/module_4_4_pretraining.html",
  "dl-module-4-5-gans": "/cources/Data_Science/DL/module_4_5_gans.html",
  "dl-module-5-1-gaussian-processes": "/cources/Data_Science/DL/module_5_1_gaussian_processes.html",
  "dl-module-5-2-bayesian-hpo": "/cources/Data_Science/DL/module_5_2_bayesian_hpo.html",
  "dl-capstone-phase-1-linear": "/cources/Data_Science/DL/capstone_phase1_linear.html",
  "dl-capstone-phase-2-mlp": "/cources/Data_Science/DL/capstone_phase2_mlp.html",
  "pytorch-tensors": "/cources/Data_Science/pytorch/module1_tensors.html",
  "pytorch-autograd": "/cources/Data_Science/pytorch/module2_autograd.html",
  "pytorch-neural-network": "/cources/Data_Science/pytorch/module3_nn_module.html",
  "pytorch-training-loop": "/cources/Data_Science/pytorch/module4_training_loop.html",
  "pytorch-data-pipeline": "/cources/Data_Science/pytorch/module5_data_pipelines.html",
  "pytorch-evaluation": "/cources/Data_Science/pytorch/module6_evaluation.html",
  "pytorch-cnn": "/cources/Data_Science/pytorch/module7_cnns.html",
  "pytorch-sequence-models": "/cources/Data_Science/pytorch/module8_sequence_models.html",
  "pytorch-training-tricks": "/cources/Data_Science/pytorch/module9_training_tricks.html",
  "pytorch-debugging": "/cources/Data_Science/pytorch/module10_debugging.html",
  "pytorch-distributed": "/cources/Data_Science/pytorch/module11_distributed.html",
  "pytorch-deployment": "/cources/Data_Science/pytorch/module12_deployment.html",
  "clustering-module0": "/cources/clus/part 1/module_0.html",
  "clustering-module1": "/cources/clus/part 1/module_1.html",
  "clustering-module2": "/cources/clus/part 1/module_2.html",
  "clustering-module3": "/cources/clus/part 1/module_3.html",
  "clustering-module4": "/cources/clus/part 1/module_4.html",
  "clustering-module5": "/cources/clus/part 1/module_5.html",
  "clustering-module6": "/cources/clus/part 1/module_6.html",
  "clustering-module7": "/cources/clus/part 1/module_7.html",
  "clustering-module8": "/cources/clus/part 1/module_8.html",
  "clustering-module9": "/cources/clus/part 1/module_9.html",
  "clustering-module10": "/cources/clus/part 1/module_10.html",
  "clustering-module11": "/cources/clus/part 1/module_11.html",
  "clustering-module12": "/cources/clus/part 2/module_12.html",
  "clustering-module13": "/cources/clus/part 2/module_13.html",
  "clustering-module14": "/cources/clus/part 2/module_14.html",
  "clustering-module15": "/cources/clus/part 2/module_15.html",
  "clustering-module16": "/cources/clus/part 2/module_16.html",
  "clustering-module17": "/cources/clus/part 2/module_17.html",
  "clustering-module18": "/cources/clus/part 2/module_18.html",
  "clustering-module19": "/cources/clus/part 2/module_19.html",
  "clustering-module20": "/cources/clus/part 2/module_20.html",
  "clustering-module21": "/cources/clus/part 2/module_21.html",
  "mrag-module-1": "/cources/generative-ai/Multi-modal-rag/multimodal_module_1.html",
  "mrag-module-2": "/cources/generative-ai/Multi-modal-rag/multimodal_module_2.html",
  "mrag-module-3": "/cources/generative-ai/Multi-modal-rag/multimodal_module_3.html",
  "mrag-module-4": "/cources/generative-ai/Multi-modal-rag/multimodal_module_4.html",
  "mrag-module-5": "/cources/generative-ai/Multi-modal-rag/multimodal_module_5.html",
  "mrag-module-6": "/cources/generative-ai/Multi-modal-rag/multimodal_module_6.html",
  "mrag-module-7": "/cources/generative-ai/Multi-modal-rag/multimodal_module_7.html",
  "mrag-module-8": "/cources/generative-ai/Multi-modal-rag/multimodal_module_8.html",
  "mrag-module-9": "/cources/generative-ai/Multi-modal-rag/multimodal_module_9.html",
  "mrag-module-10": "/cources/generative-ai/Multi-modal-rag/multimodal_module_10.html",
  "mrag-module-11": "/cources/generative-ai/Multi-modal-rag/multimodal_module_11.html",
  "mrag-module-12": "/cources/generative-ai/Multi-modal-rag/multimodal_module_12.html",
  "mrag-module-13": "/cources/generative-ai/Multi-modal-rag/multimodal_module_13.html",
  "mrag-agentic-ai-module-1": "/cources/generative-ai/Multi-modal-rag/Agentic Ai/module1_data_formats.html",
  "mrag-agentic-ai-module-2": "/cources/generative-ai/Multi-modal-rag/Agentic Ai/module2_json_schema.html",
  "mrag-agentic-ai-module-3": "/cources/generative-ai/Multi-modal-rag/Agentic Ai/module3_xml_markdown.html",
  "mrag-agentic-ai-module-4": "/cources/generative-ai/Multi-modal-rag/Agentic Ai/module4_baml_pydantic.html",
  "mrag-agentic-ai-module-5": "/cources/generative-ai/Multi-modal-rag/Agentic Ai/module5_jinja2.html",
  "mrag-agentic-ai-module-6": "/cources/generative-ai/Multi-modal-rag/Agentic Ai/module6_cicd.html",
  "mrag-multiagent-module-0": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_0.html",
  "mrag-multiagent-module-1": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_1.html",
  "mrag-multiagent-module-2": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_2 (1).html",
  "mrag-multiagent-module-3": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_3.html",
  "mrag-multiagent-module-4": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_4.html",
  "mrag-multiagent-module-5": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_5.html",
  "mrag-multiagent-module-6": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_6.html",
  "mrag-multiagent-module-7": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_7.html",
  "mrag-multiagent-module-9": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_9.html",
  "mrag-multiagent-module-10": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_10.html",
  "mrag-multiagent-module-11": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_11.html",
  "mrag-multiagent-module-12": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_12.html",
  "mrag-multiagent-module-13": "/cources/generative-ai/Multi-modal-rag/Multiagent/t2_module_13.html",
  "langgraph-module-1": "/cources/LangGraph/module1.html",
  "langgraph-module-2": "/cources/LangGraph/module2.html",
  "langgraph-module-3": "/cources/LangGraph/module3.html",
  "langgraph-module-4": "/cources/LangGraph/module4.html",
  "langgraph-module-5": "/cources/LangGraph/module5.html",
  "langgraph-module-6": "/cources/LangGraph/module6.html",
  "langgraph-module-7": "/cources/LangGraph/module7.html",
  "langgraph-module-8": "/cources/LangGraph/module8.html",
  "transformer-0-1": "/cources/Data_Science/Transofmer/module_0_1_attention_refresher.html",
  "transformer-0-2": "/cources/Data_Science/Transofmer/module_0_2_transformer_block.html",
  "transformer-1-1": "/cources/Data_Science/Transofmer/module_1_1_bert.html",
  "transformer-1-2": "/cources/Data_Science/Transofmer/module_1_2_roberta.html",
  "transformer-1-3": "/cources/Data_Science/Transofmer/module_1_3_distilbert_albert.html",
  "transformer-1-4": "/cources/Data_Science/Transofmer/module_1_4_deberta_electra.html",
  "transformer-2-1": "/cources/Data_Science/Transofmer/module_2_1_gpt2.html",
  "transformer-2-2": "/cources/Data_Science/Transofmer/module_2_2_gpt3_icl.html",
  "transformer-2-3": "/cources/Data_Science/Transofmer/module_2_3_instructgpt_rlhf.html",
  "transformer-2-4": "/cources/Data_Science/Transofmer/module_2_4_gpt4_scaling.html",
  "transformer-3-1": "/cources/Data_Science/Transofmer/module_3_1_llama.html",
  "transformer-3-2": "/cources/Data_Science/Transofmer/module_3_2_mistral_mixtral.html",
  "transformer-3-3": "/cources/Data_Science/Transofmer/module_3_3_qwen.html",
  "transformer-4-1": "/cources/Data_Science/Transofmer/module_4_1_t5_flan.html",
  "transformer-4-2": "/cources/Data_Science/Transofmer/module_4_2_bart.html",
  "transformer-5-1": "/cources/Data_Science/Transofmer/module_5_1_quadratic_bottleneck.html",
  "transformer-5-2": "/cources/Data_Science/Transofmer/module_5_2_longformer_bigbird.html",
  "transformer-5-3": "/cources/Data_Science/Transofmer/module_5_3_linear_attention.html",
  "transformer-6-1": "/cources/Data_Science/Transofmer/module_6_1_vit_deit.html",
  "transformer-6-2": "/cources/Data_Science/Transofmer/module_6_2_swin.html",
  "transformer-6-3": "/cources/Data_Science/Transofmer/module_6_3_clip.html",
  "transformer-6-4": "/cources/Data_Science/Transofmer/module_6_4_multimodal_llms.html",
  "transformer-7-1": "/cources/Data_Science/Transofmer/module_7_1_moe.html",
  "transformer-7-2": "/cources/Data_Science/Transofmer/module_7_2_ssm.html",
  "transformer-7-3": "/cources/Data_Science/Transofmer/module_7_3_production_stack.html",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_KEYS       = Object.keys(COURSE_HTML_MAP);
const WORDS_PER_MINUTE  = 200;
const FONT_SIZE_MIN     = 12;
const FONT_SIZE_MAX     = 24;
const FONT_SIZE_STEP    = 2;
const FONT_SIZE_DEFAULT = 16;
const TOPBAR_HEIGHT     = 52;
const MAX_RECENT        = 10;
const LS_RECENT_KEY     = "marevlo_recent";
const IFRAME_DARK_ID    = "mv-theme";
const IFRAME_FONT_ID    = "mv-font";

// ─── Group catalogue  (most-specific prefix first) ────────────────────────────

const GROUP_PATTERNS = [
  { prefix: "mrag-agentic-ai-module",   label: "Agentic AI",               category: "Generative AI" },
  { prefix: "mrag-multiagent-module",   label: "Multi-Agent",              category: "Generative AI" },
  { prefix: "mrag-module",              label: "Multimodal RAG",           category: "Generative AI" },
  { prefix: "rag-ingestion-ocr-layout", label: "OCR Layout",               category: "Generative AI" },
  { prefix: "rag-ingestion-ocr-text",   label: "OCR Text",                 category: "Generative AI" },
  { prefix: "rag-ingestion-ocr",        label: "OCR",                      category: "Generative AI" },
  { prefix: "rag-ingestion-dit",        label: "DIT Ingestion",            category: "Generative AI" },
  { prefix: "rag-ingestion-msp",        label: "MSP Ingestion",            category: "Generative AI" },
  { prefix: "rag-ingestion",            label: "RAG Ingestion",            category: "Generative AI" },
  { prefix: "rag-module",               label: "RAG",                      category: "Generative AI" },
  { prefix: "dla-module",               label: "Document Layout Analysis", category: "Generative AI" },
  { prefix: "ocr-text-module",          label: "OCR Text",                 category: "Generative AI" },
  { prefix: "dit-module",               label: "DIT",                      category: "Generative AI" },
  { prefix: "docformer-module",         label: "DocFormer",                category: "Generative AI" },
  { prefix: "infonce-module",           label: "InfoNCE",                  category: "Generative AI" },
  { prefix: "mfp-module",               label: "MFP",                      category: "Generative AI" },
  { prefix: "vmi-module",               label: "VMI",                      category: "Generative AI" },
  { prefix: "quant-module",             label: "Quantisation",             category: "Generative AI" },
  { prefix: "eval-module",              label: "Evaluation",               category: "Generative AI" },
  { prefix: "mcp",                      label: "MCP",                      category: "Generative AI" },
  { prefix: "langgraph-module",         label: "LangGraph",                category: "Generative AI" },
  { prefix: "prompt-engineering",       label: "Prompt Engineering",       category: "Generative AI" },
  { prefix: "dl-capstone",              label: "DL Capstone",              category: "Data Science"   },
  { prefix: "dl-module",                label: "Deep Learning",            category: "Data Science"   },
  { prefix: "dl-",                      label: "Deep Learning",            category: "Data Science"   },
  { prefix: "pytorch",                  label: "PyTorch",                  category: "Data Science"   },
  { prefix: "transformer",              label: "Transformers",             category: "Data Science"   },
  { prefix: "ml-module",                label: "Machine Learning",         category: "Data Science"   },
  { prefix: "clustering-module",        label: "Clustering",               category: "Data Science"   },
  { prefix: "module_",                  label: "Stats & Probability",      category: "Data Science"   },
  { prefix: "ds-python",                label: "Python",                   category: "Data Science"   },
  { prefix: "video-processing",         label: "Video Processing",         category: "Other"          },
];

// ─── Shared style tokens ──────────────────────────────────────────────────────

const S = {
  primaryBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "8px",
    background: "var(--color-primary-text)", color: "var(--color-app-bg)",
    border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600,
    flexShrink: 0,
  },
  outlineBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 16px", borderRadius: "8px",
    border: "1px solid var(--color-border)", background: "transparent",
    cursor: "pointer", color: "var(--color-primary-text)",
    fontSize: "13px", fontWeight: 600,
  },
  iconBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "32px", height: "32px", borderRadius: "8px",
    border: "1px solid var(--color-border)", background: "transparent",
    cursor: "pointer", color: "var(--color-muted-text)",
    flexShrink: 0,
  },
  compactBtn: {
    display: "flex", alignItems: "center", gap: "3px",
    padding: "5px 9px", borderRadius: "8px",
    border: "1px solid var(--color-border)", background: "transparent",
    cursor: "pointer", color: "var(--color-primary-text)",
    fontSize: "11px", fontWeight: 600, flexShrink: 0,
  },
};

// ─── Pure utilities ───────────────────────────────────────────────────────────

const ACRONYMS = new Set([
  "rag", "ocr", "dl", "mlp", "cnn", "rnn", "lstm", "gru",
  "gpt", "nlp", "mcp", "vmi", "mfp", "dit", "dla", "gan",
  "hpo", "mrag", "bert", "moe", "ssm",
]);

function formatTitle(id = "") {
  return id
    .split(/[-_]/)
    .map((w) =>
      ACRONYMS.has(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

function getGroup(id = "") {
  return (
    GROUP_PATTERNS.find((g) => id.startsWith(g.prefix)) ??
    { label: formatTitle(id), category: "Course", prefix: id }
  );
}

function getGroupSiblings(id = "") {
  const match = GROUP_PATTERNS.find((g) => id.startsWith(g.prefix));
  return match
    ? COURSE_KEYS.filter((k) => k.startsWith(match.prefix))
    : [id];
}

function getWordCount(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getBackgroundLuminance(doc) {
  const parts =
    window.getComputedStyle(doc.body).backgroundColor.match(/\d+/g) ??
    ["255", "255", "255"];
  const [r, g, b] = parts.map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function persistRecentlyViewed(id, group) {
  try {
    const prev  = JSON.parse(localStorage.getItem(LS_RECENT_KEY) ?? "[]");
    const entry = { id, title: formatTitle(id), group: group.label, category: group.category, visitedAt: Date.now() };
    const next  = [entry, ...prev.filter((r) => r.id !== id)].slice(0, MAX_RECENT);
    localStorage.setItem(LS_RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — non-fatal
  }
}

function injectDarkMode(doc, isDark) {
  doc.getElementById(IFRAME_DARK_ID)?.remove();
  if (!isDark) return;
  if (getBackgroundLuminance(doc) <= 0.5) return; // already dark

  const style = doc.createElement("style");
  style.id = IFRAME_DARK_ID;
  style.textContent = [
    "html { filter: invert(1) hue-rotate(180deg); }",
    "img, video, canvas, svg image { filter: invert(1) hue-rotate(180deg); }",
  ].join("\n");
  doc.head.appendChild(style);
}

function injectFontSize(doc, size) {
  doc.getElementById(IFRAME_FONT_ID)?.remove();
  if (size === FONT_SIZE_DEFAULT) return;

  const style = doc.createElement("style");
  style.id = IFRAME_FONT_ID;
  style.textContent = `html { font-size: ${size}px !important; }`;
  doc.head.appendChild(style);
}

// ─── Custom hooks ─────────────────────────────────────────────────────────────

function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function useLockBodyScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

function useCourseData(htmlFile) {
  const [status,   setStatus]   = useState("idle");
  const [readTime, setReadTime] = useState(null);

  useEffect(() => {
    if (!htmlFile) { setStatus("idle"); setReadTime(null); return; }

    setStatus("loading");
    setReadTime(null);

    const controller = new AbortController();

    fetch(htmlFile, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => {
        const minutes = Math.max(1, Math.round(getWordCount(html) / WORDS_PER_MINUTE));
        setReadTime(minutes);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [htmlFile]);

  return { status, readTime };
}

function useIframeStyles(iframeRef, { isDark, fontSize, isLoaded }) {
  const inject = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.head) return;
      injectDarkMode(doc, isDark);
      injectFontSize(doc, fontSize);
    } catch {
      // Cross-origin or document not ready — silently skip
    }
  }, [iframeRef, isDark, fontSize]);

  useEffect(() => {
    if (isLoaded) inject();
  }, [isLoaded, inject]);

  return inject;
}

function useKeyboardShortcuts({ onBack, onNext, onEscapeAll }) {
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") { onEscapeAll(); return; }
      if (e.altKey && e.key === "ArrowLeft")  { e.preventDefault(); onBack(); return; }
      if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onBack, onNext, onEscapeAll]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Spinner = () => (
  <div
    aria-hidden="true"
    style={{
      width: "18px", height: "18px", flexShrink: 0,
      border: "2px solid currentColor", borderTopColor: "transparent",
      borderRadius: "50%", animation: "cc-spin 0.7s linear infinite",
    }}
  />
);

const LoadingOverlay = memo(({ topOffset }) => (
  <div
    role="status"
    aria-label="Loading course content"
    style={{
      position: "absolute", inset: 0, top: topOffset, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--color-app-bg)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-muted-text)", fontSize: "14px", fontWeight: 500 }}>
      <Spinner />
      Loading module…
    </div>
  </div>
));
LoadingOverlay.displayName = "LoadingOverlay";

const ErrorView = memo(({ id, onBack, onSkipNext }) => (
  <div
    role="alert"
    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px" }}
  >
    <AlertTriangle size={36} aria-hidden="true" style={{ color: "#f87171" }} />
    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-primary-text)", margin: 0 }}>
      Module not found
    </p>
    <p style={{ fontSize: "13px", color: "var(--color-muted-text)", margin: 0, textAlign: "center" }}>
      The file for{" "}
      <code style={{ background: "var(--color-surface-hover)", padding: "2px 6px", borderRadius: "4px" }}>
        {id}
      </code>{" "}
      could not be loaded.
    </p>
    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
      <button onClick={onBack} style={S.outlineBtn}>
        <ArrowLeft size={13} aria-hidden="true" /> Back to Courses
      </button>
      {onSkipNext && (
        <button onClick={onSkipNext} style={S.primaryBtn}>
          Skip to Next <ChevronRight size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  </div>
));
ErrorView.displayName = "ErrorView";

const FullscreenPill = memo(({ onExit }) => (
  <button
    onClick={onExit}
    aria-label="Exit fullscreen"
    title="Exit fullscreen (Esc)"
    style={{
      position: "fixed", top: "14px", right: "16px", zIndex: 50,
      display: "flex", alignItems: "center", gap: "6px",
      padding: "6px 14px", borderRadius: "999px",
      background: "rgba(0,0,0,0.65)", color: "#fff",
      border: "1px solid rgba(255,255,255,0.15)",
      backdropFilter: "blur(8px)",
      cursor: "pointer", fontSize: "12px", fontWeight: 600,
    }}
  >
    <Minimize2 size={13} aria-hidden="true" /> Exit Fullscreen
  </button>
));
FullscreenPill.displayName = "FullscreenPill";

const ModuleMapPanel = memo(({ group, siblings, currentId, onClose, onNavigate, siblingIndex }) => {
  const progress = siblings.length > 1 ? (siblingIndex / (siblings.length - 1)) * 100 : 100;
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="cc-map-overlay"
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      />
      <aside
        aria-label={`${group.label} module list`}
        className="cc-map-panel"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "310px", zIndex: 50,
          display: "flex", flexDirection: "column",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.35)",
        }}
      >
        {/* Panel header */}
        <header style={{ padding: "18px 16px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-primary-text)", margin: 0, letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                {group.label}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 8px", borderRadius: "999px",
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                  fontSize: "10px", fontWeight: 600, color: "#818cf8",
                }}>
                  {group.category}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-muted-text)" }}>
                  {siblings.length} module{siblings.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close module map"
              className="cc-icon-btn"
              style={{ ...S.iconBtn, flexShrink: 0, marginLeft: "8px" }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", color: "var(--color-muted-text)", fontVariantNumeric: "tabular-nums" }}>
                Module {siblingIndex + 1} of {siblings.length}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#818cf8", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div style={{ height: "3px", borderRadius: "3px", background: "var(--color-surface-hover)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #6366f1, #a78bfa)",
                transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--color-border)", margin: "14px -16px 0" }} />
        </header>

        {/* Module list */}
        <nav
          className="cc-map-scroll"
          aria-label="Module navigation"
          style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}
        >
          {siblings.map((sibId, idx) => {
            const isActive = sibId === currentId;
            return (
              <button
                key={sibId}
                onClick={() => onNavigate(sibId)}
                aria-current={isActive ? "page" : undefined}
                className="cc-map-item"
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%", padding: "9px 12px", borderRadius: "10px",
                  border: isActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                  cursor: "pointer", textAlign: "left", marginBottom: "1px",
                  background: isActive ? "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(167,139,250,0.07))" : "transparent",
                  outline: "none",
                }}
              >
                <span style={{
                  fontSize: "9px", fontWeight: 700, fontFamily: "monospace",
                  color: isActive ? "#a78bfa" : "var(--color-muted-text)",
                  minWidth: "20px", textAlign: "right", flexShrink: 0,
                  fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em",
                }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontSize: "12px", fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-primary-text)" : "var(--color-muted-text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                  lineHeight: 1.4,
                }}>
                  {formatTitle(sibId)}
                </span>
                {isActive && (
                  <span aria-hidden="true" style={{
                    width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                    background: "#818cf8",
                    boxShadow: "0 0 8px rgba(129,140,248,0.7)",
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Panel footer */}
        <footer style={{
          padding: "12px 16px", borderTop: "1px solid var(--color-border)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--color-surface)",
        }}>
          <span style={{ fontSize: "11px", color: "var(--color-muted-text)", fontVariantNumeric: "tabular-nums" }}>
            {siblingIndex + 1} / {siblings.length} &nbsp;·&nbsp; {group.label}
          </span>
        </footer>
      </aside>
    </>
  );
});
ModuleMapPanel.displayName = "ModuleMapPanel";

// ─── Main component ───────────────────────────────────────────────────────────

export default function CourseContent() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const location      = useLocation();
  const fromPathIds   = location.state?.fromPathIds ?? [];
  const iframeRef     = useRef(null);

  const [isLoaded,    setIsLoaded]    = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapOpen,     setMapOpen]     = useState(false);
  const [fontSize,    setFontSize]    = useState(FONT_SIZE_DEFAULT);

  const htmlFile = COURSE_HTML_MAP[id] ?? null;

  // Fire-and-forget: records lesson progress without blocking navigation
  const markLesson = useCallback((lessonId, courseId, lessonStatus) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/learning/progress/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ course_id: courseId, status: lessonStatus }),
    }).catch(() => {});
  }, []);

  // Derived navigation state — memoised to avoid recomputation on unrelated renders
  const { prevId, nextId, group, siblings, siblingIndex } = useMemo(() => {
    const sibs   = getGroupSiblings(id);
    const sibIdx = sibs.indexOf(id);
    return {
      prevId:       sibIdx > 0 ? sibs[sibIdx - 1] : null,
      nextId:       sibIdx < sibs.length - 1 ? sibs[sibIdx + 1] : null,
      group:        getGroup(id),
      siblings:     sibs,
      siblingIndex: sibIdx,
    };
  }, [id]);

  // Hooks
  const isDark              = useTheme();
  useLockBodyScroll();
  const { status, readTime } = useCourseData(htmlFile);
  const injectStyles        = useIframeStyles(iframeRef, { isDark, fontSize, isLoaded });

  const isError = status === "error";

  // Stable navigation callbacks
  const goBack = useCallback(
    () => navigate("/courses", { state: { pathIds: fromPathIds } }),
    [navigate, fromPathIds]
  );
  const goPrev = useCallback(
    () => prevId && navigate(`/course/${prevId}`, { state: { fromPathIds } }),
    [prevId, navigate, fromPathIds]
  );
  const goNext = useCallback(() => {
    if (!nextId) return;
    markLesson(id, group.prefix, 'completed');
    navigate(`/course/${nextId}`, { state: { fromPathIds } });
  }, [nextId, id, group.prefix, markLesson, navigate, fromPathIds]);

  useKeyboardShortcuts({
    onBack:      goBack,
    onNext:      goNext,
    onEscapeAll: useCallback(() => { setIsFullscreen(false); setMapOpen(false); }, []),
  });

  // Persist recently-viewed entry once the file is confirmed accessible
  useEffect(() => {
    if (htmlFile && status === "ready") {
      persistRecentlyViewed(id, group);
    }
  }, [id, htmlFile, status, group]);

  // Reset loaded state when course changes
  useEffect(() => { setIsLoaded(false); }, [id]);

  const handleIframeLoad = useCallback(() => {
    setIsLoaded(true);
    // Small delay lets the iframe document settle before style injection
    setTimeout(injectStyles, 60);
  }, [injectStyles]);

  const handleMapNavigate = useCallback((targetId) => {
    navigate(`/course/${targetId}`, { state: { fromPathIds } });
    setMapOpen(false);
  }, [navigate, fromPathIds]);

  // Mark lesson in_progress when content is ready
  useEffect(() => {
    if (status === 'ready') markLesson(id, group.prefix, 'in_progress');
  }, [id, status, group.prefix, markLesson]);

  const [markedDone, setMarkedDone] = useState(false);
  const handleMarkDone = useCallback(() => {
    markLesson(id, group.prefix, 'completed');
    setMarkedDone(true);
  }, [id, group.prefix, markLesson]);

  // Reset done state when navigating to a new lesson
  useEffect(() => { setMarkedDone(false); }, [id]);

  const decreaseFontSize = useCallback(() => setFontSize((s) => Math.max(FONT_SIZE_MIN, s - FONT_SIZE_STEP)), []);
  const increaseFontSize = useCallback(() => setFontSize((s) => Math.min(FONT_SIZE_MAX, s + FONT_SIZE_STEP)), []);

  // ── Guard: no HTML file registered for this ID ──────────────────────────────
  if (!htmlFile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px" }}>
        <AlertTriangle size={32} aria-hidden="true" style={{ color: "var(--color-muted-text)" }} />
        <p style={{ color: "var(--color-muted-text)", fontSize: "14px", margin: 0 }}>
          No content registered for this course ID.
        </p>
        <button onClick={goBack} style={S.outlineBtn}>
          <ArrowLeft size={14} aria-hidden="true" /> Back to Courses
        </button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Top bar */}
      {!isFullscreen && (
        <header
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", height: `${TOPBAR_HEIGHT}px`, flexShrink: 0,
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface)", gap: "8px",
          }}
        >
          {/* Left — back + divider + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, overflow: "hidden" }}>
            <button onClick={goBack} title="Back to courses (Alt+←)" className="cc-back-btn" style={S.primaryBtn}>
              <ArrowLeft size={12} aria-hidden="true" /> Back
            </button>

            <div aria-hidden="true" style={{ width: "1px", height: "20px", background: "var(--color-border)", flexShrink: 0 }} />

            <nav aria-label="Course breadcrumb" style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0, overflow: "hidden" }}>
              <span style={{ fontSize: "11px", color: "var(--color-muted-text)", whiteSpace: "nowrap" }}>
                {group.category}
              </span>
              <ChevronRight size={9} aria-hidden="true" style={{ color: "var(--color-border)", flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "var(--color-muted-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>
                {group.label}
              </span>
              <ChevronRight size={9} aria-hidden="true" style={{ color: "var(--color-border)", flexShrink: 0 }} />
              <span
                aria-current="page"
                style={{
                  fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                  color: "#818cf8",
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.28)",
                  padding: "2px 9px", borderRadius: "999px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {siblingIndex + 1} / {siblings.length}
              </span>
            </nav>
          </div>

          {/* Right — controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>

            {/* Estimated read time */}
            {readTime != null && (
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "10px", color: "var(--color-muted-text)",
                padding: "4px 9px", borderRadius: "7px",
                background: "var(--color-surface-hover)",
                whiteSpace: "nowrap",
              }}>
                <Clock size={10} aria-hidden="true" /> ~{readTime} min
              </span>
            )}

            <div aria-hidden="true" style={{ width: "1px", height: "18px", background: "var(--color-border)" }} />

            {/* Font size controls */}
            <div role="group" aria-label="Font size" style={{ display: "flex", alignItems: "center", gap: "1px" }}>
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= FONT_SIZE_MIN}
                aria-label="Decrease font size"
                className="cc-compact-btn"
                style={{ ...S.compactBtn, opacity: fontSize <= FONT_SIZE_MIN ? 0.3 : 1, padding: "5px 8px" }}
              >
                A−
              </button>
              <span
                aria-live="polite"
                style={{
                  fontSize: "10px", color: "var(--color-muted-text)",
                  minWidth: "30px", textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fontSize}px
              </span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= FONT_SIZE_MAX}
                aria-label="Increase font size"
                className="cc-compact-btn"
                style={{ ...S.compactBtn, opacity: fontSize >= FONT_SIZE_MAX ? 0.3 : 1, padding: "5px 8px" }}
              >
                A+
              </button>
            </div>

            <div aria-hidden="true" style={{ width: "1px", height: "18px", background: "var(--color-border)" }} />

            {/* Prev / Next */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <button
                onClick={goPrev}
                disabled={!prevId}
                title={prevId ? `Previous: ${formatTitle(prevId)}` : undefined}
                aria-label={prevId ? `Previous module: ${formatTitle(prevId)}` : "No previous module"}
                className="cc-compact-btn"
                style={{ ...S.compactBtn, opacity: prevId ? 1 : 0.28, cursor: prevId ? "pointer" : "default" }}
              >
                <ChevronLeft size={12} aria-hidden="true" /> Prev
              </button>
              {nextId ? (
                <button
                  onClick={goNext}
                  title={`Next: ${formatTitle(nextId)}`}
                  aria-label={`Next module: ${formatTitle(nextId)}`}
                  className="cc-compact-btn"
                  style={S.compactBtn}
                >
                  Next <ChevronRight size={12} aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={handleMarkDone}
                  disabled={markedDone}
                  aria-label="Mark this module as complete"
                  className="cc-compact-btn"
                  style={{
                    ...S.compactBtn,
                    background: markedDone ? 'rgba(34,197,94,0.12)' : 'transparent',
                    borderColor: markedDone ? 'rgba(34,197,94,0.4)' : 'var(--color-border)',
                    color: markedDone ? '#22c55e' : 'var(--color-primary-text)',
                    opacity: markedDone ? 0.7 : 1,
                  }}
                >
                  {markedDone ? '✓ Done' : 'Mark Done'}
                </button>
              )}
            </div>

            <div aria-hidden="true" style={{ width: "1px", height: "18px", background: "var(--color-border)" }} />

            {/* Module map toggle */}
            <button
              onClick={() => setMapOpen((v) => !v)}
              aria-expanded={mapOpen}
              aria-label="Toggle module map"
              title="Module map"
              className="cc-icon-btn"
              style={{ ...S.iconBtn, background: mapOpen ? "rgba(99,102,241,0.12)" : "transparent", borderColor: mapOpen ? "rgba(99,102,241,0.35)" : "var(--color-border)" }}
            >
              <LayoutGrid size={14} aria-hidden="true" style={{ color: mapOpen ? "#818cf8" : "inherit" }} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(true)}
              aria-label="Enter fullscreen"
              title="Fullscreen (Esc to exit)"
              className="cc-icon-btn"
              style={S.iconBtn}
            >
              <Maximize2 size={14} aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      {/* Fullscreen exit pill */}
      {isFullscreen && <FullscreenPill onExit={() => setIsFullscreen(false)} />}

      {/* Module map panel */}
      {mapOpen && (
        <ModuleMapPanel
          group={group}
          siblings={siblings}
          currentId={id}
          siblingIndex={siblingIndex}
          onClose={() => setMapOpen(false)}
          onNavigate={handleMapNavigate}
        />
      )}

      {/* Loading overlay */}
      {!isLoaded && !isError && (
        <LoadingOverlay topOffset={isFullscreen ? 0 : TOPBAR_HEIGHT} />
      )}

      {/* Error state */}
      {isError && (
        <ErrorView
          id={id}
          onBack={goBack}
          onSkipNext={nextId ? goNext : null}
        />
      )}

      {/* Course iframe */}
      {!isError && (
        <iframe
          key={id}
          ref={iframeRef}
          src={htmlFile}
          title={formatTitle(id)}
          onLoad={handleIframeLoad}
          allowFullScreen
          style={{
            flex: 1, border: "none", display: "block",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 220ms ease",
          }}
        />
      )}

      <style>{`
        @keyframes cc-spin    { to { transform: rotate(360deg); } }
        @keyframes cc-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cc-fade-in  { from { opacity: 0; } to { opacity: 1; } }

        .cc-back-btn    { transition: filter 140ms ease, transform 100ms ease; }
        .cc-back-btn:hover  { filter: brightness(1.14); }
        .cc-back-btn:active { transform: scale(0.97); }

        .cc-icon-btn { transition: background 140ms ease, border-color 140ms ease, color 140ms ease; }
        .cc-icon-btn:hover { background: var(--color-surface-hover) !important; color: var(--color-primary-text) !important; }

        .cc-compact-btn { transition: background 140ms ease, border-color 140ms ease; }
        .cc-compact-btn:hover:not(:disabled) { background: var(--color-surface-hover) !important; border-color: rgba(99,102,241,0.4) !important; }

        .cc-map-overlay { animation: cc-fade-in 180ms ease; }
        .cc-map-panel   { animation: cc-slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1); }

        .cc-map-item { transition: background 120ms ease; }
        .cc-map-item:hover { background: var(--color-surface-hover) !important; }

        .cc-map-scroll::-webkit-scrollbar       { width: 3px; }
        .cc-map-scroll::-webkit-scrollbar-track { background: transparent; }
        .cc-map-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
        .cc-map-scroll::-webkit-scrollbar-thumb:hover { background: var(--color-muted-text); }
      `}</style>
    </div>
  );
}
