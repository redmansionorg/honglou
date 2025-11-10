
import React, { useState, useEffect } from "react";
import { Novel, Chapter } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Code, Eye } from "lucide-react";

export default function DebugComponent() {
  const [novels, setNovels] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [novelData, chapterData] = await Promise.all([
        Novel.list(),
        Chapter.list()
      ]);
      setNovels(novelData);
      setChapters(chapterData);
      console.log("Novels:", novelData);
      console.log("Chapters:", chapterData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const createChaptersForNovel = async (novelId, novelTitle) => {
    try {
      const existingChapters = chapters.filter(c => c.novel_id === novelId);
      for (const chapter of existingChapters) {
        await Chapter.delete(chapter.id);
      }

      let chapterData = [];
      
      if (novelTitle.includes("红楼梦")) {
        chapterData = [
          {
            novel_id: novelId,
            chapter_number: 1,
            title: "重回大观园",
            content: "春暖花开的季节，贾宝玉从一个奇怪的梦中醒来。他发现自己身处一个陌生而又熟悉的环境——这里依然是大观园，但却充满了现代化的气息。\n\n高楼大厦与古典园林交相辉映，传统与现代在这里完美融合。宝玉走到窗前，看到林黛玉正在院子里练习太极，动作优美而有力。\n\n她穿着一身白色的练功服，黑发在阳光下闪闪发光。这时，薛宝钗也从另一个方向走来，她穿着一身职业装，手里拿着平板电脑，看起来像是一个成功的商业女性。\n\n宝玉困惑地看着她们，心中充满了疑问。这个世界到底发生了什么？为什么一切都变得如此不同？",
            word_count: 280,
            published: true
          },
          {
            novel_id: novelId,
            chapter_number: 2,
            title: "现代的贾府",
            content: "在宝钗的带领下，宝玉来到了贾府的新办公楼。这栋大楼保持着古典建筑的外观，但内部却是现代化的办公环境。\n\n贾府已经从一个传统的贵族家庭转型为一个现代企业集团。贾氏集团现在是国内最大的文化产业公司之一，专注于传统文化的现代化传承和发展。\n\n走廊里挂着各种奖状和荣誉证书，宝玉看到了许多熟悉的名字。来到会议室，宝玉看到了一个熟悉而又陌生的场景。\n\n贾政正在主持一个关于新项目的会议。宝玉惊讶地发现，在这个世界里，每个人都找到了自己的位置。",
            word_count: 245,
            published: true
          },
          {
            novel_id: novelId,
            chapter_number: 3,
            title: "黛玉的新生活",
            content: "午休时间，宝玉来到了黛玉的工作室。这里充满了艺术气息，墙上挂着各种书法作品和绘画，书架上摆满了古典文学和现代文学的书籍。\n\n黛玉正坐在电脑前，专注地写着一个新的故事。宝玉走到她身边，看到屏幕上的文字流畅而富有诗意。\n\n黛玉的文笔依然如此出色，但内容却更加深刻和现实。她的眼中闪烁着自信的光芒，那种曾经的忧郁和脆弱已经完全消失了。\n\n黛玉告诉宝玉，她在这里找到了自己的价值，她的文字能够影响更多的人，能够为社会做出贡献。",
            word_count: 232,
            published: true
          }
        ];
      } else if (novelTitle.includes("仙侠")) {
        chapterData = [
          {
            novel_id: novelId,
            chapter_number: 1,
            title: "穿越仙门",
            content: "李明原本是一个普通的程序员，每天过着朝九晚五的生活。直到那个雷电交加的夜晚，他正在加班调试代码，突然一道闪电劈中了他的电脑。\n\n当他再次醒来时，发现自己躺在一个陌生的地方。这里山清水秀，云雾缭绕，到处都散发着一种神秘的气息。\n\n正在这时，一个穿着白色长袍的老者从天而降，落在他面前。老者告诉他这里是仙界，他是被天雷选中的人，可以通过修炼获得超凡的力量。\n\n李明看着眼前的奇景，心中升起了一种前所未有的激动。这是他从小就梦想的世界，现在竟然真的来到了这里。",
            word_count: 256,
            published: true
          },
          {
            novel_id: novelId,
            chapter_number: 2,
            title: "初入青云门",
            content: "跟随老者来到青云门，李明被眼前的景象深深震撼了。这里的建筑宏伟壮观，每一座殿宇都散发着古老而神秘的气息。\n\n空中时不时有弟子御剑飞过，留下一道道美丽的光芒。他们来到一座大殿前，殿内正坐着一位仙风道骨的中年男子。\n\n掌门仔细打量着李明，告诉他修仙之路艰难险阻，要做好心理准备。从今天开始，李明就是青云门的外门弟子。\n\n一个年轻的弟子王峰走了过来，以后就由他来指导李明的修炼。王峰解释说，修仙第一步就是筑基，需要打通全身经脉，建立内丹。\n\n这个过程需要很长时间，要有耐心。",
            word_count: 298,
            published: true
          }
        ];
      } else if (novelTitle.includes("都市")) {
        chapterData = [
          {
            novel_id: novelId,
            chapter_number: 1,
            title: "深夜的电话",
            content: "凌晨三点，刑警队长张伟被一通电话惊醒。CBD商务区发现一具尸体，情况很复杂。\n\n二十分钟后，张伟赶到了案发现场。这里是城市最繁华的商务区，平时即使是深夜也有很多人经过。\n\n死者是李华，35岁，某金融公司的高管，初步检查死因是中毒。张伟仔细观察着现场。\n\n死者躺在一条僻静的小巷里，身上穿着昂贵的西装，没有外伤痕迹。死者的手机不见了，但钱包还在，里面的现金和信用卡都没有动过，这不像是抢劫案。\n\n张伟感到这个案子不简单。一个金融高管深夜被人毒死，而且现场没有留下任何明显的线索。",
            word_count: 298,
            published: true
          }
        ];
      }

      for (const chapter of chapterData) {
        await Chapter.create(chapter);
      }

      alert(`成功为《${novelTitle}》创建了 ${chapterData.length} 个章节！`);
      loadData();
    } catch (error) {
      console.error("Error creating chapters:", error);
      alert("创建章节时出错，请查看控制台");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">调试工具</h2>
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Eye className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Code className="w-5 h-5 text-green-400" />
            小说列表 ({novels.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          ) : (
            novels.map((novel) => (
              <div key={novel.id} className="border border-white/20 p-4 rounded-lg space-y-2 bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">{novel.title}</h3>
                    <p className="text-sm text-white/60">ID: {novel.id}</p>
                    <p className="text-sm text-white/60">作者: {novel.author}</p>
                  </div>
                  <Button 
                    onClick={() => createChaptersForNovel(novel.id, novel.title)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    创建章节
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Code className="w-5 h-5 text-blue-400" />
            章节列表 ({chapters.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="border border-white/20 p-2 rounded text-sm bg-white/5">
              <p className="text-white"><strong>章节:</strong> {chapter.title}</p>
              <p className="text-white/60"><strong>小说ID:</strong> {chapter.novel_id}</p>
              <p className="text-white/60"><strong>章节号:</strong> {chapter.chapter_number}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
