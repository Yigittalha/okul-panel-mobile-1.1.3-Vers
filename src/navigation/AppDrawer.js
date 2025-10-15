import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionContext } from "../state/session";
import TeacherBottomMenu from "../components/TeacherBottomMenu";

// Import dashboard screens
import AdminDashboard from "../app/admin/AdminDashboard";
// Import TeacherDashboard screen
import TeacherDashboard from "../app/teacher/TeacherDashboard";
import ParentDashboard from "../app/parent/ParentDashboard";
import StudentHomePage from "../app/student/StudentHomePage";
// Import TeachersList and StudentsList screens
import TeachersList from "../app/common/TeachersList";
import StudentsList from "../app/common/StudentsList";
// Import TeacherSchedule screen
import TeacherSchedule from "../app/teacher/TeacherSchedule";
import TeacherScheduleScreen from "../app/teacher/TeacherScheduleScreen";
// Import Attendance screen
import Attendance from "../app/teacher/attendance";
// Import AttendanceResults screen
import AttendanceResults from "../app/teacher/AttendanceResults";
// Import HomeworkAssignment screen
import HomeworkAssignment from "../app/teacher/HomeworkAssignment";
// Import HomeworksGivenList screen
import HomeworksGivenList from "../app/teacher/HomeworksGivenList";
// Import HomeworkGivenDetail screen
import HomeworkGivenDetail from "../app/teacher/HomeworkGivenDetail";
// Import HomeworkPoints screen
import HomeworkPoints from "../app/teacher/HomeworkPoints";
// Import StudentHomeworkList screen
import StudentHomeworkList from "../app/parent/StudentHomeworkList";
// Import StudentHomeworkDetail screen
import StudentHomeworkDetail from "../app/parent/StudentHomeworkDetail";
// Import StudentAbsences screen
import StudentAbsences from "../app/parent/StudentAbsences";
// Import StudentScheduleScreen
import StudentScheduleScreen from "../app/student/StudentScheduleScreen";
// Import ExamAdd screen
import ExamAdd from "../app/teacher/ExamAdd";
// Import ExamsList screen
import ExamsList from "../app/teacher/ExamsList";
// Import ExamDetail screen
import ExamDetail from "../app/teacher/ExamDetail";
// Import ExamGrading screen
import ExamGrading from "../app/teacher/ExamGrading";
// Import Student Exams screens
import StudentExamsList from "../app/student/StudentExamsList";
import StudentExamDetail from "../app/student/StudentExamDetail";
// Import Student Grades screen
import StudentGrades from "../app/student/StudentGrades";
// Import MessageSend screen
import MessageSend from "../app/teacher/MessageSend";
// Import Profile screen
import Profile from "../app/teacher/Profile";
// Import HomePage screen
import HomePage from "../app/teacher/HomePage";
// Import DailySummary screen
import DailySummary from "../app/teacher/DailySummary";
// Import MessageInbox screen
import MessageInbox from "../app/teacher/MessageInbox";
// Import StudentMessageSend screen
import StudentMessageSend from "../app/student/StudentMessageSend";
// Import StudentMessageInbox screen
import StudentMessageInbox from "../app/student/StudentMessageInbox";
// Import PasswordChangeScreen
import PasswordChangeScreen from "../app/common/PasswordChangeScreen";
// Import PhotoViewer screen
import PhotoViewer from "../app/common/PhotoViewer";
// Import ParentProfile screen
import ParentProfile from "../app/parent/ParentProfile";

const Stack = createNativeStackNavigator();

// Teacher sayfaları için wrapper component
const TeacherPageWrapper = ({ children, navigation, currentRoute }) => {
  const insets = useSafeAreaInsets();
  
  // Alt menü yüksekliği: 50px (menuContainer) + 5px (padding) + safe area
  // Bu değer TeacherBottomMenu.js'deki gerçek yükseklikle eşleşmeli
  const bottomMenuHeight = 55 + Math.max(insets.bottom, 4);
  
  return (
    <View style={{ flex: 1 }}>
      <View style={{ 
        flex: 1, 
        paddingBottom: bottomMenuHeight // Alt menü için güvenli alan
      }}>
        {children}
      </View>
      <TeacherBottomMenu navigation={navigation} currentRoute={currentRoute} />
    </View>
  );
};

// Her sayfa için ayrı component'ler (inline function warning'lerini önlemek için)
const HomePageWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation} currentRoute="HomePage">
    <HomePage />
  </TeacherPageWrapper>
);

const ProfileWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation} currentRoute="Profile">
    <Profile />
  </TeacherPageWrapper>
);

const DailySummaryWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <DailySummary />
  </TeacherPageWrapper>
);

const TeacherScheduleWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation} currentRoute="TeacherSchedule">
    <TeacherSchedule />
  </TeacherPageWrapper>
);

const TeacherScheduleScreenWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <TeacherScheduleScreen />
  </TeacherPageWrapper>
);

const AttendanceWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation} currentRoute="Attendance">
    <Attendance />
  </TeacherPageWrapper>
);

const AttendanceResultsWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <AttendanceResults />
  </TeacherPageWrapper>
);

const TeachersListWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <TeachersList />
  </TeacherPageWrapper>
);

const StudentsListWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <StudentsList />
  </TeacherPageWrapper>
);

const HomeworkAssignmentWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <HomeworkAssignment />
  </TeacherPageWrapper>
);

const HomeworksGivenListWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <HomeworksGivenList />
  </TeacherPageWrapper>
);

const HomeworkGivenDetailWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <HomeworkGivenDetail />
  </TeacherPageWrapper>
);

const HomeworkPointsWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <HomeworkPoints />
  </TeacherPageWrapper>
);

const ExamAddWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <ExamAdd />
  </TeacherPageWrapper>
);

const ExamsListWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <ExamsList />
  </TeacherPageWrapper>
);

const ExamDetailWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <ExamDetail />
  </TeacherPageWrapper>
);

const ExamGradingWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <ExamGrading />
  </TeacherPageWrapper>
);

const MessageSendWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation} currentRoute="MessageSend">
    <MessageSend />
  </TeacherPageWrapper>
);

const MessageInboxWithMenu = ({ navigation }) => (
  <TeacherPageWrapper navigation={navigation}>
    <MessageInbox />
  </TeacherPageWrapper>
);

/**
 * Ana çekmece navigasyonu
 * Not: SlideMenu component'i ayrı bir dosyaya taşındı
 * ve döngüsel bağımlılık ortadan kaldırıldı
 */
export default function AppDrawer() {
  const { role } = useContext(SessionContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === "admin" && (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="TeachersList" component={TeachersList} />
          <Stack.Screen name="StudentsList" component={StudentsList} />
        </>
      )}
      {role === "teacher" && (
        <>
          <Stack.Screen name="HomePage" component={HomePageWithMenu} />
          <Stack.Screen name="TeacherDashboard" component={HomePageWithMenu} />
          <Stack.Screen name="Profile" component={ProfileWithMenu} />
          <Stack.Screen name="DailySummary" component={DailySummaryWithMenu} />
          <Stack.Screen name="TeacherSchedule" component={TeacherScheduleWithMenu} />
          <Stack.Screen name="TeacherScheduleScreen" component={TeacherScheduleScreenWithMenu} />
          <Stack.Screen name="Attendance" component={AttendanceWithMenu} />
          <Stack.Screen name="AttendanceResults" component={AttendanceResultsWithMenu} />
          <Stack.Screen name="TeachersList" component={TeachersListWithMenu} />
          <Stack.Screen name="StudentsList" component={StudentsListWithMenu} />
          <Stack.Screen name="HomeworkAssignment" component={HomeworkAssignmentWithMenu} />
          <Stack.Screen name="HomeworksGivenList" component={HomeworksGivenListWithMenu} />
          <Stack.Screen name="HomeworkGivenDetail" component={HomeworkGivenDetailWithMenu} />
          <Stack.Screen name="HomeworkPoints" component={HomeworkPointsWithMenu} />
          <Stack.Screen name="ExamAdd" component={ExamAddWithMenu} />
          <Stack.Screen name="ExamsList" component={ExamsListWithMenu} />
          <Stack.Screen name="ExamDetail" component={ExamDetailWithMenu} />
          <Stack.Screen name="ExamGrading" component={ExamGradingWithMenu} />
          <Stack.Screen name="MessageSend" component={MessageSendWithMenu} />
          <Stack.Screen name="MessageInbox" component={MessageInboxWithMenu} />
          <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
          <Stack.Screen name="PhotoViewer" component={PhotoViewer} />
        </>
      )}
      {role === "parent" && (
        <>
          <Stack.Screen name="StudentHomePage" component={StudentHomePage} />
          <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
          <Stack.Screen
            name="StudentHomeworkList"
            component={StudentHomeworkList}
          />
          <Stack.Screen
            name="StudentHomeworkDetail"
            component={StudentHomeworkDetail}
          />
          <Stack.Screen name="StudentExamsList" component={StudentExamsList} />
          <Stack.Screen name="StudentExamDetail" component={StudentExamDetail} />
          <Stack.Screen name="StudentGrades" component={StudentGrades} />
          <Stack.Screen name="StudentAbsences" component={StudentAbsences} />
          <Stack.Screen name="StudentScheduleScreen" component={StudentScheduleScreen} />
          <Stack.Screen name="StudentMessageSend" component={StudentMessageSend} />
          <Stack.Screen name="StudentMessageInbox" component={StudentMessageInbox} />
          <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
          <Stack.Screen name="PhotoViewer" component={PhotoViewer} />
          <Stack.Screen name="ParentProfile" component={ParentProfile} />
        </>
      )}
    </Stack.Navigator>
  );
}
