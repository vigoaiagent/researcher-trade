import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';

export async function callRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // 注册multipart插件
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max
    },
  });

  // 确保上传目录存在
  const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 上传通话录音
  fastify.post('/recording', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No recording file uploaded' });
      }

      // 检查文件类型
      if (!data.mimetype.startsWith('audio/')) {
        return reply.status(400).send({ error: 'Only audio files are allowed' });
      }

      // 生成唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = 'recording-' + uniqueSuffix + path.extname(data.filename);
      const filePath = path.join(uploadDir, fileName);

      // 保存文件
      await pipeline(data.file, fs.createWriteStream(filePath));

      // 获取文件大小
      const stats = fs.statSync(filePath);

      // 从fields获取其他数据
      const fields: Record<string, any> = {};
      for await (const part of data.fields as any) {
        if (part.fieldname) {
          fields[part.fieldname] = part.value;
        }
      }

      const roomId = fields.roomId || data.fields?.roomId?.value || '';
      const duration = parseInt(fields.duration || data.fields?.duration?.value || '0');
      const timestamp = fields.timestamp || data.fields?.timestamp?.value;

      if (!roomId) {
        // 删除已上传的文件
        fs.unlinkSync(filePath);
        return reply.status(400).send({ error: 'roomId is required' });
      }

      // 创建录音记录
      const recording = await prisma.callRecording.create({
        data: {
          roomId,
          filePath,
          fileName,
          fileSize: stats.size,
          duration,
          recordedAt: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      console.log(`📼 Call recording saved: ${fileName} (${stats.size} bytes, ${duration}s)`);

      return {
        success: true,
        recordingId: recording.id,
        message: 'Recording uploaded successfully',
      };
    } catch (error) {
      console.error('Error uploading recording:', error);
      return reply.status(500).send({ error: 'Failed to upload recording' });
    }
  });

  // 获取通话录音列表（管理员用）
  fastify.get<{
    Querystring: { roomId?: string; page?: string; limit?: string };
  }>('/recordings', async (request, reply) => {
    try {
      const { roomId, page = '1', limit = '20' } = request.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = roomId ? { roomId } : {};

      const [recordings, total] = await Promise.all([
        prisma.callRecording.findMany({
          where,
          orderBy: { recordedAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.callRecording.count({ where }),
      ]);

      return {
        recordings,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      };
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return reply.status(500).send({ error: 'Failed to fetch recordings' });
    }
  });

  // 获取单个录音详情
  fastify.get<{
    Params: { id: string };
  }>('/recording/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const recording = await prisma.callRecording.findUnique({
        where: { id },
      });

      if (!recording) {
        return reply.status(404).send({ error: 'Recording not found' });
      }

      return recording;
    } catch (error) {
      console.error('Error fetching recording:', error);
      return reply.status(500).send({ error: 'Failed to fetch recording' });
    }
  });

  // 下载录音文件
  fastify.get<{
    Params: { id: string };
  }>('/recording/:id/download', async (request, reply) => {
    try {
      const { id } = request.params;

      const recording = await prisma.callRecording.findUnique({
        where: { id },
      });

      if (!recording) {
        return reply.status(404).send({ error: 'Recording not found' });
      }

      if (!fs.existsSync(recording.filePath)) {
        return reply.status(404).send({ error: 'Recording file not found' });
      }

      const stream = fs.createReadStream(recording.filePath);
      return reply
        .header('Content-Type', 'audio/webm')
        .header('Content-Disposition', `attachment; filename="${recording.fileName}"`)
        .send(stream);
    } catch (error) {
      console.error('Error downloading recording:', error);
      return reply.status(500).send({ error: 'Failed to download recording' });
    }
  });
}
