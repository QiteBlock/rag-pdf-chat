import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Progress,
  Icon,
} from "@chakra-ui/react";
import { FiUpload, FiFile } from "react-icons/fi";
import axios from "axios";

const PDFUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type === "application/pdf") {
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/upload_pdf/`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 1)
                );
                setProgress(percentCompleted);
              },
            }
          );

          toast({
            title: "Success",
            description: "PDF uploaded successfully!",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload PDF. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setUploading(false);
        }
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a PDF file.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  return (
    <Box
      {...getRootProps()}
      p={6}
      border="2px dashed"
      borderColor={isDragActive ? "blue.400" : "gray.200"}
      borderRadius="lg"
      bg={isDragActive ? "blue.50" : "white"}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: "blue.400", bg: "blue.50" }}
    >
      <input {...getInputProps()} />
      <VStack spacing={4}>
        <Icon as={FiUpload} w={8} h={8} color="blue.500" />
        <Text fontSize="lg" fontWeight="medium">
          {isDragActive
            ? "Drop the PDF here"
            : "Drag & drop a PDF here, or click to select"}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Only PDF files are accepted
        </Text>
        {uploading && (
          <Box w="full">
            <Progress value={progress} size="sm" colorScheme="blue" />
            <Text mt={2} fontSize="sm" textAlign="center">
              Uploading... {progress}%
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default PDFUpload;
