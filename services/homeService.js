const { ConsoleMessage } = require("puppeteer");
const {
    LecturePost,
    Lecture,
    User,
    Role,
    RoleApplier,
    UserProfileImg,
} = require("../models");
const { myFindMajor } = require("../utils/myFunction");

module.exports = {
    findLecturePosts: async (userId) => {
        try {
            let major;
            let limit = 10;
            /*
             * LecturePost 에서 가져와야 하는 것 : lecture_id, writer_id, endDate, title, detail, viewCnt
             * Lecture 에서 가져와야 하는 것: name, professor, semester, schedule, major(null여부) => json.stringify()로 해당 key 값만 넘겨주면 될듯.
             * User에서 가져와야하는 것 : id, name, nickname, level
             * UserProfileImg에서 가져와야 하는 것 : (user_id로 찾기) file
             * RoleApplier에서 가져와야 하는 것 : (lecturePost_id로 찾기)
             * id 세기 -> 곧 해당 게시물의 total 지원자 수
             * status 가 success 인 id 세기 -> 곧 해당 게시물의 current 를 뜻함.
             */

            // 유저가 작성한 구인글 모두 가져오기
            /** 효민 : 유저가 작성하지 않은 것도 보여줘야함 **/
            /** 효민 : 데이터 처리 속도가 느림 최적화 필요 **/
            const lecturePosts = await LecturePost.findAll({
                // where: {
                //     writer_id: userId,
                // },
                limit: limit,
                order: [["createdAt", "DESC"]], // 최신순
            }).then((res) => {
                return res.map((res) => {
                    return {
                        ...res.dataValues,
                        isOwner: res.dataValues.writer_id === userId,
                    };
                });
            });

            const data_list = [];
            console.log(lecturePosts);

            for (let l = 0; l < lecturePosts.length; l++) {
                // lecturePost의 lecture_id로 Lecture에서 해당 과목 찾기
                const lecturePost = lecturePosts[l];
                console.log("개별 post : ", lecturePost);
                const lecture = await Lecture.findOne({
                    where: {
                        id: lecturePost.lecture_id,
                    },
                }).then((result) => {
                    return result.dataValues;
                });

                major = await myFindMajor(lecture);

                // 유저 찾아서 프로필 이미지 가져오기
                const writer = await User.findOne({
                    where: { id: lecturePost.writer_id },
                    include: [
                        {
                            model: UserProfileImg,
                            require: false,
                            where: { user_id: lecturePost.writer_id },
                        },
                    ],
                });
                console.log("writer!!!! : " + writer);

                // const profileImg = await UserProfileImg.findOne({
                //     where: {
                //         user_id: userId,
                //     },
                // });
                // console.log("profileImg : " + profileImg.id);

                // total : 해당 포스트의 총 지원자 수
                // current : status == "success"인 사람
                /*
                const total = await RoleApplier.findAndCountAll({
                    where: {
                        lecturePost_id: lecturePost.id,
                    },
                    distinct: true, // 연결된 테이블로 인해 count가 바뀌는 현상을 막을 수 있다
                }).then((result) => {
                    return result.count;
                });
                console.log("total : " + total);

                const current = await RoleApplier.findAndCountAll({
                    where: {
                        lecturePost_id: lecturePost.id,
                        status: "success",
                    },
                    distinct: true, // 연결된 테이블로 인해 count가 바뀌는 현상을 막을 수 있다
                }).then((result) => {
                    return result.count;
                });*/
                const list = await Role.findAll({
                    where: { lecturePost_id: lecturePost.id },
                    include: [
                        {
                            model: RoleApplier,
                            required: false,
                            where: { lecturePost_id: lecturePost.id },
                        },
                    ],
                }).then((res) => res.map((value) => value.dataValues));

                let total = 0;
                let current = 0;
                list.forEach((role) => {
                    total += role.max;
                    role.RoleAppliers.forEach((mem) => {
                        if (mem.status === "success") current++;
                    });
                });
                // const current = applier.filter(
                //     (item) => item.status === "success"
                // ).length;
                console.log("current : " + current);
                // data_list 정리
                data_list.push({
                    id: lecturePost.id,
                    lecture: {
                        lectureId: lecture.id,
                        name: lecture.name,
                        professors: JSON.parse(lecture.professor),
                        semester: lecture.semester,
                        schedule: JSON.parse(lecture.schedule),
                    },
                    type: major,
                    isOwner: lecturePost.isOwner,
                    writer: {
                        studentId: writer.id,
                        name: writer.name,
                        nickname: writer.nickname,
                        level: writer.level,
                        profileImg: writer.UserProfileImg.file,
                    },
                    endDate: lecturePost.endDate,
                    title: lecturePost.title,
                    detail: lecturePost.detail,
                    viewCount: lecturePost.viewCnt,
                    total: total,
                    current: current,
                });
            }
            return data_list;
        } catch (err) {
            console.log(err);
            throw Error(err);
        }
    },
};
