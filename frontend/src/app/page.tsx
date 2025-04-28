"use client";

import { Box, Container, Heading, VStack, Text } from "@chakra-ui/react";
import PDFUpload from "../components/PDFUpload";
import Chat from "../components/Chat";

export default function Home() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            PDF Chat Assistant
          </Heading>
          <Text color="gray.600">
            Upload a PDF and ask questions about its content
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={4}>
            Upload PDF
          </Heading>
          <PDFUpload />
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={4}>
            Chat
          </Heading>
          <Box h="600px">
            <Chat />
          </Box>
        </Box>
      </VStack>
    </Container>
  );
}
